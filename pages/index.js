import { useEffect, useState } from "react";
import Head from "next/head";

export default function Home() {
  const [settings, setSettings] = useState({});
  const [fields, setFields] = useState([]);
  const [tasks, setTasks] = useState([]);

  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [audios, setAudios] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const s = await fetch("/api/get-settings");
        if (s.ok) {
          const data = await s.json();
          if (typeof data === "object") setSettings(data);
        }

        const f = await fetch("/api/get-fields");
        if (f.ok) {
          const data = await f.json();
          if (Array.isArray(data)) setFields(data);
        }

        const t = await fetch("/api/get-tasks");
        if (t.ok) {
          const data = await t.json();
          if (Array.isArray(data)) setTasks(data);
        }
      } catch (err) {
        console.log("Config load failed");
      }
    }

    load();
  }, []);

  async function sendOTP() {
    await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });
    setMessage("OTP sent");
  }

  async function verifyOTP() {
    const res = await fetch("/api/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, otp })
    });

    const data = await res.json();
    if (data.success) {
      setVerified(true);
      setMessage("Email verified");
    } else {
      setMessage("Wrong OTP");
    }
  }

  return (
    <>
      <Head>
        <style>{`body{margin:0;background:#000;color:#fff}`}</style>
      </Head>

      <div style={{ padding: 40 }}>
        <h2>{settings.Title || "Voice Gig"}</h2>

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

        {Array.isArray(fields) &&
          fields.map(f => (
            <input
              key={f.key}
              placeholder={f.label}
              style={inputStyle}
            />
          ))}

        {Array.isArray(tasks) &&
          tasks.map((t, i) => (
            <div key={i}>{t.text}</div>
          ))}

        <p style={{ marginTop: 20 }}>{message}</p>
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
