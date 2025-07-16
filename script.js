
document.addEventListener("DOMContentLoaded", function () {
  const firebaseConfig = {
    apiKey: "AIzaSyANSUcWFghm8AEuXdTJ-hLMAW3xVni0bNk",
    authDomain: "gsyn1345.firebaseapp.com",
    projectId: "gsyn1345",
    storageBucket: "gsyn1345.firebasestorage.app",
    messagingSenderId: "176230721020",
    appId: "1:176230721020:web:847104e59f42dd4c4e7e79",
    measurementId: "G-RB5SD1CQ44",
    databaseURL: "https://gsyn1345-default-rtdb.asia-southeast1.firebasedatabase.app"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.database();

  const form = document.getElementById("registerForm");
  const tableBody = document.querySelector("#participantTable tbody");

  function renderRow({ name, email, time }) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${name}</td><td>${time}</td>`;
    tableBody.appendChild(tr);
  }

  function loadData() {
    const ref = db.ref("participants/");
    ref.on("value", snapshot => {
      const data = snapshot.val();
      tableBody.innerHTML = "";
      if (data) {
        Object.values(data).forEach(renderRow);
      }
    });
  }

  function isWithinTimeWindow(startTime, endTime) {
    const now = new Date();
    const start = new Date();
    const end = new Date();
    const [sh, sm] = startTime.split(":").map(Number);
    const [eh, em] = endTime.split(":").map(Number);
    start.setHours(sh, sm, 0);
    end.setHours(eh, em, 0);
    return now >= start && now <= end;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();

    if (!isWithinTimeWindow("09:00", "14:00")) {
      alert("Chỉ được đăng ký từ 9:00 đến 14:00 mỗi ngày.");
      return;
    }

    const name = document.getElementById("name").value.trim();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const time = new Date().toLocaleString("vi-VN");

    const ref = db.ref("participants/");
    ref.once("value", snapshot => {
      const existing = snapshot.val();
      
      const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
      const isDuplicateToday = existing && Object.values(existing).some(p => {
        const entryDate = new Date(p.time);
        const entryDay = entryDate.toISOString().slice(0, 10);
        return entryDay === today && (p.name === name || p.email === email);
      });

      if (isDuplicateToday) {
        alert("You have already registered today. Please try again tomorrow.");
        return;
      }

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const vipRef = db.ref("vipWinners/");

      vipRef.once("value", vipSnap => {
        const vipData = vipSnap.val();
        const alreadyWon = vipData && Object.values(vipData).some(entry => {
          const entryDate = new Date(entry.time);
          return (
            entry.email === email &&
            entryDate.getMonth() === currentMonth &&
            entryDate.getFullYear() === currentYear
          );
        });

        if (alreadyWon) {
          alert("Bạn đã từng trúng vé VIP trong tháng này. Vui lòng thử lại vào tháng sau.");
          return;
        }

        ref.push({ name, email, time });

        if (now.getHours() === 14 && now.getMinutes() >= 1) {
          vipRef.push({ name, email, time });
        }

        vipRef.once("value", vsnap => {
  const winners = vsnap.val();
  const latest = winners ? Object.values(winners).slice(-1)[0] : null;
  if (latest && latest.name) {
    document.getElementById("vipMessage").innerHTML = "🎉 Congratulations <span class='vip-name'>" + latest.name + "</span> - You're the VIP of the Day!";
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });
  }
});
form.reset();
      });
    });
  });

  loadData();
});


  // Auto pick a VIP at 14:01 client-side
  const now = new Date();
  if (now.getHours() === 14 && now.getMinutes() === 1) {
    const today = now.toISOString().slice(0, 10);
    const participantsRef = db.ref("participants/");
    const vipRef = db.ref("vipWinners/");

    participantsRef.once("value", pSnap => {
      const all = pSnap.val();
      if (!all) return;

      const todayList = Object.values(all).filter(p => {
        const entryDate = new Date(p.time).toISOString().slice(0, 10);
        return entryDate === today;
      });

      vipRef.once("value", vSnap => {
        const vipData = vSnap.val();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const alreadyVIPs = vipData ? Object.values(vipData).filter(entry => {
          const d = new Date(entry.time);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        }).map(v => v.email) : [];

        const eligible = todayList.filter(p => !alreadyVIPs.includes(p.email));
        if (eligible.length > 0) {
          const winner = eligible[Math.floor(Math.random() * eligible.length)];
          vipRef.push(winner);
          document.getElementById("vipMessage").innerHTML =
            "🎉 Congratulations <span class='vip-name'>" + winner.name + "</span> - You're the VIP of the Day!";
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.6 } });
        }
      });
    });
  }

function showTodayVipFromWinners() {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const ref = firebase.database().ref("vipWinners/");
  ref.once("value", snapshot => {
    const data = snapshot.val();
    if (!data) return;
    const todayWinner = Object.values(data).filter(entry => {
      const entryDate = new Date(entry.time).toISOString().slice(0, 10);
      return entryDate === today;
    }).slice(-1)[0];

    if (todayWinner) {
      document.getElementById("vipMessage").innerHTML =
        "🎉 Congratulations <span class='vip-name'>" + todayWinner.name + "</span> - You're the VIP of the Day!";
      confetti({ particleCount: 200, spread: 70, origin: { y: 0.6 } });
    }
  });
}
showTodayVipFromWinners();
