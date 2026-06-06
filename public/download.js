/* ================= DOWNLOAD ALL EXAM ANSWERS ================= */

function safeArray(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  return [];
}

window.downloadExam = async function () {

  if (typeof JSZip === "undefined") {
    alert("JSZip yuklanmagan!");
    return;
  }

  const zip = new JSZip();

  const all = JSON.parse(localStorage.getItem("examAnswers") || "{}");

  /* ================= GRAMMAR ================= */
  const grammar = safeArray(all.grammar);

  let grammarTxt = "GRAMMAR\n====================\n\n";

  grammar.forEach((q, i) => {
    grammarTxt += `${i + 1}. Question: ${q.question || "—"}\n`;
    grammarTxt += `   Answer: ${q.answer || "—"}\n\n`;
  });

  zip.file("grammar.txt", grammarTxt);


  /* ================= LISTENING ================= */
  const listening = safeArray(all.listening);

  let listeningTxt = "LISTENING\n====================\n\n";

  listening.forEach((q, i) => {
    listeningTxt += `${i + 1}. Question: ${q.question || "—"}\n`;
    listeningTxt += `   Answer: ${q.answer || "—"}\n\n`;
  });

  zip.file("listening.txt", listeningTxt);


  /* ================= WRITING ================= */
  const writing = safeArray(all.writing);

  let writingTxt = "WRITING\n====================\n\n";

  writing.forEach((q, i) => {
    writingTxt += `${i + 1}. Topic: ${q.question || q.task || "—"}\n`;
    writingTxt += `   Answer: ${q.answer || "—"}\n`;
    writingTxt += `   Level: ${q.level || "—"}\n\n`;
  });

  zip.file("writing.txt", writingTxt);


  /* ================= READING ================= */
  const reading = safeArray(all.reading);

  let readingTxt = "READING\n====================\n\n";

  reading.forEach((passage, i) => {

    if (!passage || !Array.isArray(passage.questions)) return;

    readingTxt += `PASSAGE ${i + 1}\n\n`;

    passage.questions.forEach((q, j) => {
      readingTxt += `${j + 1}. Question: ${q.question || "—"}\n`;
      readingTxt += `   Answer: ${q.answer || "—"}\n\n`;
    });

    readingTxt += "--------------------\n\n";
  });

  zip.file("reading.txt", readingTxt);


  /* ================= SPEAKING ================= */
  const speaking = safeArray(all.speaking);

  let speakingTxt = "SPEAKING\n====================\n\n";

  const addedAudioIndices = new Set();
  let audioCount = 0;

  speaking.forEach((q, i) => {
    const hasAudio = q.audio && (
      q.audio.startsWith("data:audio") ||
      q.audio.startsWith("data:application/octet-stream")
    );

    speakingTxt += `${i + 1}. Question: ${q.question || "—"}\n`;
    speakingTxt += `   Difficulty: ${q.difficulty || "—"}\n`;
    speakingTxt += `   Audio: ${hasAudio ? "BOR" : "YO'Q"}\n\n`;

    if (hasAudio) {
      const idx = (q.audioIndex !== undefined) ? parseInt(q.audioIndex) : i;
      if (!isNaN(idx) && !addedAudioIndices.has(idx)) {
        let audioData = localStorage.getItem("speaking_audio_" + idx);
        if (!audioData && q.audio) {
          audioData = q.audio;
        }
        if (audioData) {
          const base64Data = audioData.split(",")[1];
          if (base64Data) {
            zip.file("speaking_audio_" + (audioCount + 1) + ".webm", base64Data, { base64: true });
            addedAudioIndices.add(idx);
            audioCount++;
          }
        }
      }
    }
  });

  zip.file("speaking.txt", speakingTxt);


  /* ================= PHOTO ================= */
  let photoAdded = false;
  
  if (all.photo) {
    const base64Data = all.photo.split(",")[1];
    if (base64Data) {
      zip.file("photo.jpg", base64Data, { base64: true });
      photoAdded = true;
    }
  }
  
  if (!photoAdded) {
    const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
    if (currentUser && currentUser.photo) {
      const base64Data = currentUser.photo.split(",")[1];
      if (base64Data) {
        zip.file("photo.jpg", base64Data, { base64: true });
        photoAdded = true;
      }
    }
  }


  /* ================= PAYMENT RECEIPT ================= */
  const currentUser = JSON.parse(localStorage.getItem("currentUser") || "null");
  if (currentUser && currentUser.email) {
    const paymentData = JSON.parse(localStorage.getItem("paymentReceipt_" + currentUser.email) || "null");
    if (paymentData && paymentData.fileData) {
      const commaIndex = paymentData.fileData.indexOf(",");
      if (commaIndex !== -1) {
        const receiptBase64 = paymentData.fileData.substring(commaIndex + 1);
        const ext = paymentData.fileName.split('.').pop() || "jpg";
        zip.file("payment_receipt." + ext, receiptBase64, { base64: true });
      }
    }
  }


  /* ================= CREATE ZIP ================= */
  const blob = await zip.generateAsync({ type: "blob" });

  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "EXAM_RESULT.zip";
  a.click();
};