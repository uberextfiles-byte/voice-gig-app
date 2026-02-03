import { useState } from "react";

export default function Home() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [verified, setVerified] = useState(false);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");

  const sendOTP = async () => {
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email })
    });

    const data = await res.json();
    setMessage("OTP sent (use 123456 for now)");
  };

  const verifyOTP = async () => {
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
      setMessage("Invalid OTP ❌");
    }
  };

  const submitForm = async () => {
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email })
    });

    const data = await res.json();

    if (data.success) {
      setMessage("Submitted successfully 🚀");
    } else {
      setMessage("Submission failed");
    }
  };

  return (
    <div style={{ padding: 40, maxWidth: 400 }}>
      <h1>Voice Gig Application</h1>

      <input
        placeholder="Your Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />

      <button onClick={sendOTP}>Send OTP</button>

      <br /><br />

      <input
        placeholder="Enter OTP"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        style={{ width: "100%", marginBottom: 10 }}
      />

      <button onClick={verifyOTP}>Verify OTP</button>

      <br /><br />

      {verified && (
        <>
          <input
            placeholder="Your Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ width: "100%", marginBottom: 10 }}
          />

          <button onClick={submitForm}>Submit</button>
        </>
      )}

      <p>{message}</p>
    </div>
  );
}
