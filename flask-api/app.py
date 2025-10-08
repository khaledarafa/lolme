from flask import Flask, request, jsonify
from PIL import Image
from deforum import deforum_pipeline  # تأكد من تثبيت deforum

app = Flask(__name__)

@app.route("/generate-video", methods=["POST"])
def generate_video():
    file = request.files['image']
    caption = request.form['caption']
    
    img = Image.open(file)
    img.save("temp_cat.png")

    # توليد الفيديو القصير
    video = deforum_pipeline(
        init_image="temp_cat.png",
        prompt=f"funny cat cartoon, {caption}",
        steps=50,   # عدد الإطارات
        fps=10      # سرعة الفيديو
    )

    video.save("static/funny_cat.mp4")

    return jsonify({"video_url": "http://127.0.0.1:5000/static/funny_cat.mp4"})

if __name__ == "__main__":
    app.run(debug=True)
