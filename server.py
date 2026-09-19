import os
import tempfile

from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from dotenv import load_dotenv

load_dotenv()



app = Flask(__name__)

CORS(app)


# --------------------------------------------------
# In-memory session
# --------------------------------------------------

_session = {
    "rag_chain": None,
    "transcript": "",
    "title": ""
}


# --------------------------------------------------
# Serve frontend
# --------------------------------------------------

@app.route("/")
def home():
    return render_template("index.html")


# --------------------------------------------------
# Health check
# --------------------------------------------------

@app.route("/health", methods=["GET"])
def health():

    return jsonify({
        "status": "ok",
        "service": "AI Video Assistant"
    })


# --------------------------------------------------
# Analyze YouTube URL
# --------------------------------------------------

@app.route("/analyze", methods=["POST"])
def analyze():

    data = request.get_json(silent=True) or {}

    source = data.get("source", "").strip()
    language = data.get("language", "english").strip()

    if not source:

        return jsonify({
            "error": "No source provided"
        }), 400

    try:

        result = run_pipeline(
            source,
            language
        )

        return jsonify(result)

    except Exception as e:

        print("ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500


# --------------------------------------------------
# Analyze uploaded file
# --------------------------------------------------

@app.route("/analyze/upload", methods=["POST"])
def analyze_upload():

    if "file" not in request.files:

        return jsonify({
            "error": "No file uploaded"
        }), 400

    file = request.files["file"]

    language = request.form.get(
        "language",
        "english"
    )

    if not file.filename:

        return jsonify({
            "error": "Invalid file"
        }), 400

    suffix = (
        os.path.splitext(file.filename)[1]
        or ".mp4"
    )

    tmp_path = None

    try:

        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=suffix
        ) as tmp:

            file.save(tmp.name)
            tmp_path = tmp.name

        result = run_pipeline(
            tmp_path,
            language
        )

        return jsonify(result)

    except Exception as e:

        print("ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500

    finally:

        if tmp_path:

            try:
                os.unlink(tmp_path)

            except OSError:
                pass


# --------------------------------------------------
# Chat with video
# --------------------------------------------------

@app.route("/chat", methods=["POST"])
def chat():
    from core.rag_engine import ask_question
    if _session["rag_chain"] is None:

        return jsonify({
            "error": "No video has been analyzed yet."
        }), 400

    data = request.get_json(silent=True) or {}

    question = data.get(
        "question",
        ""
    ).strip()

    if not question:

        return jsonify({
            "error": "No question provided"
        }), 400

    try:

        answer = ask_question(
            _session["rag_chain"],
            question
        )

        return jsonify({
            "answer": answer
        })

    except Exception as e:

        print("ERROR:", e)

        return jsonify({
            "error": str(e)
        }), 500


# --------------------------------------------------
# Main AI pipeline
# --------------------------------------------------

def run_pipeline(
    source: str,
    language: str = "english"
):
    from utils.audio_processor import process_input
    from core.transcriber import transcribe_all
    from core.summarize import summarize, generate_title
    from core.extractor import (
        extract_action_items,
        extract_key_decisions,
        extract_questions
    )
    from core.rag_engine import build_rag_chain

    print("\n" + "=" * 60)
    print("STARTING AI VIDEO ASSISTANT")
    print("=" * 60)

    # 1. Audio processing

    print("\n[1/6] Processing audio...")

    chunks = process_input(source)

    # 2. Transcription

    print("\n[2/6] Transcribing...")

    transcript = transcribe_all(
        chunks,
        language=language
    )

    # 3. Title

    print("\n[3/6] Generating title...")

    title = generate_title(
        transcript
    )

    # 4. Summary

    print("\n[4/6] Generating summary...")

    summary = summarize(
        transcript
    )

    # 5. Extraction

    print("\n[5/6] Extracting meeting information...")

    action_items = extract_action_items(
        transcript
    )

    decisions = extract_key_decisions(
        transcript
    )

    questions = extract_questions(
        transcript
    )

    # 6. RAG

    print("\n[6/6] Building RAG system...")

    rag_chain = build_rag_chain(
        transcript
    )

    # Store session

    _session["rag_chain"] = rag_chain
    _session["transcript"] = transcript
    _session["title"] = title

    print("\nPipeline completed.")

    return {

        "title": title,

        "transcript": transcript,

        "summary": summary,

        "action_items": action_items,

        "key_decisions": decisions,

        "open_questions": questions
    }

from a2wsgi import WSGIMiddleware

asgi_app = WSGIMiddleware(app)
# --------------------------------------------------
# Run server
# --------------------------------------------------

if __name__ == "__main__":

    port = int(
        os.environ.get(
            "PORT",
            5000
        )
    )

    print(
        f"\nAI Video Assistant running at:"
        f"\nhttp://localhost:{port}\n"
    )

    app.run(
        host="0.0.0.0",
        debug=True,
        use_reloader=False,
        port=port
    )