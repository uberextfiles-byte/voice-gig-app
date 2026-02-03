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
  const [loading, setLoading] = useState(false);

  const [recordingIndex, setRecordingIndex] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [savedIndex, setSavedIndex] = useState(null);

  const [browserId] = useState(
    typeof window !== "undefined"
      ? localStorage.getItem("BID") ||
          (localStorage.setItem("BID", "BID_" + Math.random()),
          localStorage.getItem("BID"))
      : ""
  );

  const [startTime] = useState(Date.now());

  // ---------------- LOAD CONFIG ----------------

  useEffect(() => {
    fetch("/api/get-settings")
      .then(r => r.json())
      .then(data => setSettings(data))
      .catch(() => {});

    fetch("/api/get-fields")
      .then(r => r.json())
      .then(data => setFields(data))
      .catch(() => {});

    fetch("/api/get-tasks")
      .then(r => r.json())
      .then(data => setTasks(data))
      .catch(() => {});
  }, []);

  if (settings.GigOpen === "NO") {
    return <h2 style={{ padding: 40 }}>Gig is currently closed</h2>;
  }

  // ---------------- OTP ----------------

  async function sendOTP() {
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    if (data.success) {
      setMessage("OTP sent");
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

  // ---------------- RECORD ----------------

  async function startRec(index, max) {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);

    let chunks = [];
    let sec = 0;

    setRecordingIndex(index);
    setSavedIndex(null);
    setSeconds(0);

    const timer = setInterval(() => {
      sec++;
      setSeconds(sec);

      if (sec >= max) recorder.stop();
    }, 1000);

    recorder.ondataavailable = e => chunks.push(e.data);

    recorder.onstop = () => {
      clearInterval(timer);
      setRecordingIndex(null);
      setSavedIndex(index);

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
    if (!verified) return alert("Verify email first");

    setLoading(true);

    const dynamicFields = {};
    fields.forEach(f => {
      dynamicFields[f.key] =
        document.getElementById(f.key)?.value || "";
    });

    const payload = {
      name,
      email,
      fields: dynamicFields,
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

    setMessage(data.success ? "Submitted 🚀" : "Failed ❌");
    setLoading(false);
  }

  return (
    <>
      <Head>
        <style>{`body{margin:0;background:#000}`}</style>
      </Head>

      <div style={{ padding: 40, color: "#fff" }}>
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

        <button style={btnStyle} onClick={sendOTP}>Send OTP</button>

        <input
          placeholder="OTP"
          value={otp}
          onChange={e => setOtp(e.target.value)}
          style={inputStyle}
        />

        <button style={btnStyle} onClick={verifyOTP}>Verify</button>

        {/* Dynamic Fields */}
        {fields.map(f => (
          f.type === "dropdown" ? (
            <select key={f.key} id={f.key} style={inputStyle}>
              <option value="">Select {f.label}</option>
              {f.options?.split(",").map(o => (
                <option key={o}>{o.trim()}</option>
              ))}
            </select>
          ) : (
            <input
              key={f.key}
              id={f.key}
              placeholder={f.label}
              style={inputStyle}
            />
          )
        ))}

        {/* Dynamic Tasks */}
        {tasks.map((t, i) => (
          <div key={i} style={{ marginTop: 20 }}>
            <p>{t.text}</p>

            {recordingIndex !== i && (
              <button
                style={btnStyle}
                onClick={() => startRec(i, t.max)}
              >
                Start Recording
              </button>
            )}

            {recordingIndex === i && (
              <div style={{ color: "#ff4d4d" }}>
                🔴 Recording... {seconds}s
              </div>
            )}

            {savedIndex === i && (
              <div style={{ color: "#00ff88" }}>
                ✅ Recording saved
              </div>
            )}
          </div>
        ))}

        <button
          style={{ ...btnStyle, marginTop: 30 }}
          onClick={submit}
          disabled={loading}
        >
          {loading ? "Submitting..." : "SUBMIT"}
        </button>

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
