import { useEffect, useState } from "react";

export default function Home() {
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [audios, setAudios] = useState([]);
  const [browserId] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("BID") ||
          (localStorage.setItem("BID", "BID_" + Math.random()),
          localStorage.getItem("BID"))
      : ""
  );
  const [startTime] = useState(Date.now());
  const [message, setMessage] = useState("");

  // ----- OTP -----
  async function sendOTP() {
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (data.success) {
      setMessage("OTP sent (use 123456)");
    }
  }

  async function verifyOTP() {
    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ otp })
    });

    const data = await res.json();

    if (data.success) {
      setVerified(true);
      setMessage("Email verified ✅");
    } else {
      setMessage("Wrong OTP ❌");
    }
  }

  // ----- AUDIO RECORD -----
  async function startRec(index, max) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    let chunks = [];
    let seconds = 0;

    const timer = setInterval(() => {
      seconds++;
      if (seconds >= max) stopRec(recorder, timer, stream, index);
    }, 1000);

    recorder.ondataavailable = e => chunks.push(e.data);

    recorder.onstop = () => {
      clearInterval(timer);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(",")[1];
        setAudios(prev => {
          const copy = [...prev];
          copy[index] = base64;
          return copy;
        });
      };
      reader.readAsDataURL(new Blob(chunks, { type: "audio/webm" }));
      stream.getTracks().forEach(t => t.stop());
    };

    recorder.start();
  }

  function stopRec(recorder, timer, stream, index) {
    if (recorder && recorder.state === "recording") {
      recorder.stop();
    }
  }

  // ----- SUBMIT -----
  async function submit() {
    if (!verified) {
      alert("Verify email first");
      return;
    }

    const payload = {
      name,
      email,
      audios,
      browserId,
      submitTime: Math.floor((Date.now() - startTime) / 1000),
      emailVerified: true
    };

    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (data.success) {
      setMessage("Thank you! 🚀");
    } else {
      setMessage("Submission failed");
    }
  }

  return (
    <div style={{
      background: "#000",
      color: "#fff",
      padding: 30,
      maxWidth: 760,
      margin: "auto",
      minHeight: "100vh"
    }}>
      <h2>Voice Gig</h2>

      <input
        placeholder="Name"
        value={name}
        onChange={e => setName(e.target.value)}
        style={inputStyle}
      />

      <input
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        style={inputStyle}
      />

      <button onClick={sendOTP}>Send OTP</button>

      <br /><br />

      <input
        placeholder="OTP"
        value={otp}
        onChange={e => setOtp(e.target.value)}
        style={inputStyle}
      />

      <button onClick={verifyOTP}>Verify</button>

      <br /><br />

      <div>
        <p>Task 1: Record 30 seconds</p>
        <button onClick={() => startRec(0, 30)}>Start</button>
      </div>

      <br />

      <button onClick={submit}>SUBMIT</button>

      <p>{message}</p>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: 10,
  marginBottom: 10,
  background: "#111",
  color: "#fff",
  border: "1px solid #444",
  borderRadius: 6
};
