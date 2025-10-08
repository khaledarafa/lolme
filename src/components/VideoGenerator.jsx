import { useState } from 'react';

export default function VideoGenerator() {
  const [videoUrl, setVideoUrl] = useState("");

  const generateVideo = async () => {
    const imageFile = document.getElementById('catImage').files[0];
    const caption = document.getElementById('caption').value;

    if(!imageFile) return alert("اختار صورة أولاً");

    const formData = new FormData();
    formData.append("image", imageFile);
    formData.append("caption", caption);

    const res = await fetch("http://127.0.0.1:5000/generate-video", {
      method: "POST",
      body: formData
    });

    const data = await res.json();
    setVideoUrl(data.video_url);
  }

  return (
    <>
      <input type="file" id="catImage" accept="image/*" /><br/>
      <textarea id="caption" placeholder="اكتب هنا الكوميديا بتاعتك!" rows="2"></textarea><br/>
      <button onClick={generateVideo}>اعمل الفيديو</button>
      {videoUrl && <video src={videoUrl} controls width="320"></video>}
    </>
  );
}
