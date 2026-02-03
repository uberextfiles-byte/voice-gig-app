import { useState } from "react";
import Head from "next/head";

export default function Home() {
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [audios, setAudios] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [browserId] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("BID") ||
          (localStorage.setItem("BID", "BID_" + Math.random()),
          localStorage.getItem("BID"))
      : ""
  );

  const [startTime] = useState(Date.now());

  // ---------------- OTP ----------------

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

  // ---------------- AUDIO RECORD ----------------

  async function startRec(index, max) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    let chunks = [];
    let seconds = 0;

    const timer = setInterval(() => {
      seconds++;
      if (seconds >= max) {
        recorder.stop();
      }
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

  // ---------------- SUBMIT ----------------

  async function submit() {
    if (!verified) {
      alert("Verify email first");
      return;
    }

    if (!name || !email) {
      alert("Fill all required fields");
      return;
    }

    if (!audios[0]) {
      alert("Record audio before submitting");
      return;
    }

    setLoading(true);

    try {
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
        setMessage("Application submitted successfully 🚀");
      } else {
        setMessage("Submission failed ❌");
      }
    } catch (err) {
      setMessage("Server error ❌");
    }

    setLoading(false);
  }

  return (
    <>
      <Head>
        <style>{`
          body {
            margin: 0;
            background: #000;
          }
        `}</style>
      </Head>

      <div
        style={{
          background: "#000",
          minHeight: "100vh",
          padding: 40,
          color: "#fff"
        }}
      >
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <h2 style={{ marginBottom: 20 }}>Voice Gig</h2>

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

          <button style={btnStyle} onClick={sendOTP}>
            Send OTP
          </button>

          <input
            placeholder="OTP"
            value={otp}
            onChange={e => setOtp(e.target.value)}
            style={inputStyle}
          />

          <button style={btnStyle} onClick={verifyOTP}>
            Verify
          </button>

          <div style={{ marginTop: 30 }}>
            <p>Task 1: Record 30 seconds</p>
            <button
              style={btnStyle}
              onClick={() => startRec(0, 30)}
            >
              Start Recording
            </button>
          </div>

          <button
            style={{
              ...btnStyle,
              marginTop: 30,
              opacity: loading ? 0.6 : 1
            }}
            onClick={submit}
            disabled={loading}
          >
            {loading ? "Submitting..." : "SUBMIT"}
          </button>

          <p style={{ marginTop: 20 }}>{message}</p>
        </div>
      </div>
    </>
  );
}

const inputStyle = {
  width: "100%",
  padding: 12,
  marginBottom: 12,
  background: "#111",
  color: "#fff",
  border: "1px solid #333",
  borderRadius: 6
};

const btnStyle = {
  padding: "8px 16px",
  background: "#222",
  color: "#fff",
  border: "1px solid #444",
  cursor: "pointer",
  marginBottom: 10
};
