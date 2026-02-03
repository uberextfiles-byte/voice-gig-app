const [loading, setLoading] = useState(false);

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
