
const admin = require("firebase-admin");

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: "gsyn1345",
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
    }),
    databaseURL: "https://gsyn1345-default-rtdb.asia-southeast1.firebasedatabase.app"
  });
}

module.exports = async (req, res) => {
  const db = admin.database();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  try {
    const snapshot = await db.ref("participants").once("value");
    const participants = snapshot.val();
    const todayList = Object.values(participants || {}).filter(p => {
      const entryDate = new Date(p.time).toISOString().slice(0, 10);
      return entryDate === today;
    });

    const vipSnap = await db.ref("vipWinners").once("value");
    const vipData = vipSnap.val();

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const alreadyVIPs = vipData ? Object.values(vipData).filter(entry => {
      const d = new Date(entry.time);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    }).map(v => v.email) : [];

    const eligible = todayList.filter(p => !alreadyVIPs.includes(p.email));
    if (eligible.length === 0) {
      return res.status(200).send("No eligible participants.");
    }

    const winner = eligible[Math.floor(Math.random() * eligible.length)];
    await db.ref("vipWinners").push(winner);
    await db.ref("vipLogs").push({
      pickedAt: new Date().toISOString(),
      pickedBy: "Vercel Function (auto)",
      name: winner.name,
      email: winner.email,
      time: winner.time
    });

    return res.status(200).send("VIP chosen: " + winner.name);
  } catch (error) {
    console.error("Error picking VIP:", error);
    return res.status(500).send("Error selecting VIP.");
  }
};
