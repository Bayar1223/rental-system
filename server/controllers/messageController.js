const mongoose    = require("mongoose");
const Message     = require("../models/Message");
const Application = require("../models/Application");
const { createNotification } = require("./notificationController");

// Хэрэглэгч тухайн гэрээний оролцогч мөн эсэх + нөгөө талыг буцаах
function resolveParties(application, userId) {
  const tenantId   = application.tenant.toString();
  const landlordId = application.landlord.toString();
  const isParticipant = userId === tenantId || userId === landlordId;
  const recipient = userId === tenantId ? landlordId : tenantId;
  return { tenantId, landlordId, isParticipant, recipient };
}

// ───────────────────────────────────────────────────────────────────
//  POST /api/messages  — зурвас илгээх
//  body: { applicationId, text }
// ───────────────────────────────────────────────────────────────────
exports.sendMessage = async (req, res) => {
  try {
    const { applicationId, text } = req.body;
    const userId = (req.user._id || req.user.id).toString();

    if (!applicationId || !text || !text.trim()) {
      return res.status(400).json({ message: "Зурвас хоосон байна" });
    }

    const application = await Application.findById(applicationId)
      .populate("property", "title");
    if (!application) return res.status(404).json({ message: "Гэрээ олдсонгүй" });

    const { isParticipant, recipient } = resolveParties(application, userId);
    if (!isParticipant && req.user.role !== "admin") {
      return res.status(403).json({ message: "Эрх байхгүй" });
    }
    // Админ оролцогч биш бол хэнд илгээхийг тодорхойлох боломжгүй
    if (!isParticipant) {
      return res.status(400).json({ message: "Зөвхөн гэрээний талууд бичих боломжтой" });
    }

    const created = await Message.create({
      application: applicationId,
      sender:      userId,
      recipient,
      text:        text.trim(),
    });

    const message = await created.populate("sender", "firstName lastName avatar");

    // Хүлээн авагчид мэдэгдэл (Notification.type enum-д "general" байгаа)
    await createNotification({
      user:    recipient,
      title:   "Шинэ зурвас ирлээ ◇",
      message: `${message.sender.name || "Хэрэглэгч"}: ${text.trim().slice(0, 80)}`,
      type:    "general",
      link:    `/messages/${applicationId}`,
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// ───────────────────────────────────────────────────────────────────
//  GET /api/messages/:applicationId  — thread-ийн бүх зурвас
//  (нэгэн зэрэг надад ирсэн уншаагүй зурвасуудыг "уншсан" болгоно)
// ───────────────────────────────────────────────────────────────────
exports.getMessages = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const userId = (req.user._id || req.user.id).toString();

    const application = await Application.findById(applicationId);
    if (!application) return res.status(404).json({ message: "Гэрээ олдсонгүй" });

    const { isParticipant } = resolveParties(application, userId);
    if (!isParticipant && req.user.role !== "admin") {
      return res.status(403).json({ message: "Эрх байхгүй" });
    }

    // Надад ирсэн уншаагүйг уншсан болгох
    await Message.updateMany(
      { application: applicationId, recipient: userId, isRead: false },
      { $set: { isRead: true } }
    );

    const messages = await Message.find({ application: applicationId })
      .populate("sender", "firstName lastName avatar")
      .sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).json({ message: "Гэрээ олдсонгүй" });
    }
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// ───────────────────────────────────────────────────────────────────
//  GET /api/messages/unread-count  — навбар badge-д
// ───────────────────────────────────────────────────────────────────
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const count = await Message.countDocuments({
      recipient: userId,
      isRead: false,
    });
    res.json({ count });
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};

// ───────────────────────────────────────────────────────────────────
//  GET /api/messages/threads  — inbox (харилцаа бүрийн сүүлийн зурвас)
// ───────────────────────────────────────────────────────────────────
exports.getThreads = async (req, res) => {
  try {
    const userId = new mongoose.Types.ObjectId(
      (req.user._id || req.user.id).toString()
    );

    const grouped = await Message.aggregate([
      { $match: { $or: [{ sender: userId }, { recipient: userId }] } },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id:          "$application",
          lastMessage:  { $first: "$text" },
          lastSenderId: { $first: "$sender" },
          lastAt:       { $first: "$createdAt" },
          unread: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$recipient", userId] },
                    { $eq: ["$isRead", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
      { $sort: { lastAt: -1 } },
    ]);

    const appIds = grouped.map((g) => g._id);
    const apps = await Application.find({ _id: { $in: appIds } })
      .populate("property", "title location images")
      .populate("tenant",   "firstName lastName avatar")
      .populate("landlord", "firstName lastName avatar");

    const map = new Map(apps.map((a) => [a._id.toString(), a]));
    const meId = userId.toString();

    const threads = grouped
      .map((g) => {
        const app = map.get(g._id.toString());
        if (!app) return null;
        const isTenant = app.tenant?._id?.toString() === meId;
        const other    = isTenant ? app.landlord : app.tenant;
        return {
          applicationId: g._id,
          property:      app.property,
          other,                 // populated User (name virtual toJSON-оор гарна)
          lastMessage:   g.lastMessage,
          lastAt:        g.lastAt,
          unread:        g.unread,
          mine:          g.lastSenderId?.toString() === meId,
        };
      })
      .filter(Boolean);

    res.json(threads);
  } catch (error) {
    res.status(500).json({ message: "Алдаа гарлаа", error: error.message });
  }
};