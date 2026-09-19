const API_BASE = "";

let selectedLanguage = "english";
let selectedFile = null;
let sessionData = null;


/* =========================================
   ELEMENTS
========================================= */

const youtubeUrl = document.getElementById("youtubeUrl");

const fileInput = document.getElementById("fileInput");

const uploadBox = document.getElementById("uploadBox");

const browseBtn = document.getElementById("browseBtn");

const selectedFileBox =
    document.getElementById("selectedFile");

const fileName =
    document.getElementById("fileName");

const removeFile =
    document.getElementById("removeFile");

const analyzeBtn =
    document.getElementById("analyzeBtn");


/* =========================================
   NAVIGATION
========================================= */

const navButtons =
    document.querySelectorAll(".nav-btn");

const pages =
    document.querySelectorAll(".page");


function showPage(pageName) {

    pages.forEach(page => {

        page.classList.remove("active");

    });


    const page =
        document.getElementById(
            `${pageName}Page`
        );


    if (page) {

        page.classList.add("active");

    }


    navButtons.forEach(btn => {

        btn.classList.remove("active");

    });


    const activeBtn =
        document.querySelector(
            `[data-page="${pageName}"]`
        );


    if (activeBtn) {

        activeBtn.classList.add("active");

    }


    const titles = {

        home: "New Analysis",

        analysis: "Video Analysis",

        transcript: "Full Transcript",

        chat: "Chat with Video"

    };


    document.getElementById(
        "headerTitle"
    ).textContent =
        titles[pageName] || "AI Video Assistant";

}


window.showPage = showPage;


/* =========================================
   LANGUAGE
========================================= */

document
    .querySelectorAll(".language-btn")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                document
                    .querySelectorAll(".language-btn")
                    .forEach(btn =>
                        btn.classList.remove("active")
                    );

                button.classList.add("active");

                selectedLanguage =
                    button.dataset.language;

            }
        );

    });

/* =========================================
   POLL JOB STATUS
========================================= */

async function pollJob(jobId) {

    while (true) {

        await new Promise(
            resolve => setTimeout(resolve, 3000)
        );

        let job;

        try {

            const res =
                await fetch(`/status/${jobId}`);

            job = await res.json();

        } catch {

            continue; // temporary network problem, keep polling

        }

        if (job.status === "done") {
            return job.result;
        }

        if (job.status === "error") {
            throw new Error(job.error);
        }

        if (job.status === "not_found") {
            throw new Error(
                "Server restarted during analysis (likely out of memory)."
            );
        }

    }

}
/* =========================================
   FILE UPLOAD
========================================= */

browseBtn.addEventListener(
    "click",
    event => {

        event.stopPropagation();

        fileInput.click();

    }
);


uploadBox.addEventListener(
    "click",
    () => {

        fileInput.click();

    }
);


fileInput.addEventListener(
    "change",
    () => {

        if (fileInput.files.length > 0) {

            setSelectedFile(
                fileInput.files[0]
            );

        }

    }
);


function setSelectedFile(file) {

    selectedFile = file;

    fileName.textContent =
        `${file.name} (${formatSize(file.size)})`;

    selectedFileBox.hidden = false;

    youtubeUrl.value = "";

}


removeFile.addEventListener(
    "click",
    () => {

        selectedFile = null;

        fileInput.value = "";

        selectedFileBox.hidden = true;

    }
);


function formatSize(bytes) {

    const mb =
        bytes / (1024 * 1024);

    return `${mb.toFixed(1)} MB`;

}


/* =========================================
   DRAG & DROP
========================================= */

uploadBox.addEventListener(
    "dragover",
    event => {

        event.preventDefault();

        uploadBox.classList.add("dragging");

    }
);


uploadBox.addEventListener(
    "dragleave",
    () => {

        uploadBox.classList.remove(
            "dragging"
        );

    }
);


uploadBox.addEventListener(
    "drop",
    event => {

        event.preventDefault();

        uploadBox.classList.remove(
            "dragging"
        );


        const file =
            event.dataTransfer.files[0];


        if (file) {

            setSelectedFile(file);

        }

    }
);


/* =========================================
   ANALYZE
========================================= */

analyzeBtn.addEventListener(
    "click",
    analyzeVideo
);


async function analyzeVideo() {

    const url =
        youtubeUrl.value.trim();


    if (!url && !selectedFile) {

        showToast(
            "Please add a YouTube URL or upload a file."
        );

        return;

    }


    analyzeBtn.disabled = true;


    showPage("processing");


    startProcessingAnimation();


    try {

        let response;


        /* YouTube */

        if (url) {

            response =
                await fetch(
                    "/analyze",
                    {

                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            source: url,

                            language:
                                selectedLanguage

                        })

                    }
                );

        }


        /* File */

        else {

            const formData =
                new FormData();


            formData.append(
                "file",
                selectedFile
            );


            formData.append(
                "language",
                selectedLanguage
            );


            response =
                await fetch(
                    "/analyze/upload",
                    {

                        method: "POST",

                        body: formData

                    }
                );

        }


        // const data =
        //     await response.json();


        // if (!response.ok) {

        //     throw new Error(
        //         data.error ||
        //         "Analysis failed."
        //     );

        // }


        // sessionData = data;

        const started =
            await response.json();


        if (!response.ok) {

            throw new Error(
                started.error ||
                "Analysis failed."
            );

        }


        const data =
            await pollJob(started.job_id);


        sessionData = data;
        displayResults(data);


        enableSessionNavigation();


        showPage("analysis");


        showToast(
            "Video analysis completed!"
        );


    }

    catch (error) {

        console.error(error);

        showToast(
            error.message ||
            "Something went wrong."
        );

        showPage("home");

    }

    finally {

        analyzeBtn.disabled = false;

        stopProcessingAnimation();

    }

}


/* =========================================
   PROCESSING ANIMATION
========================================= */

let processingTimer;

let processingStep = 0;


function startProcessingAnimation() {

    processingStep = 0;

    updateProcessingStep();

    processingTimer =
        setInterval(
            () => {

                if (processingStep < 3) {

                    processingStep++;

                    updateProcessingStep();

                }

            },
            4500
        );

}


function updateProcessingStep() {

    const steps = [
        document.getElementById("step1"),
        document.getElementById("step2"),
        document.getElementById("step3"),
        document.getElementById("step4")
    ];


    steps.forEach(
        (step, index) => {

            step.classList.remove(
                "active",
                "done"
            );


            if (index < processingStep) {

                step.classList.add("done");

            }

            else if (
                index === processingStep
            ) {

                step.classList.add("active");

            }

        }
    );


    const messages = [

        "Preparing and converting your audio...",

        "Transcribing the video content...",

        "Generating summary and meeting insights...",

        "Creating your RAG knowledge base..."

    ];


    document.getElementById(
        "processingText"
    ).textContent =
        messages[processingStep];


    const percentage =
        [10, 35, 70, 90][processingStep];


    document.getElementById(
        "progressBar"
    ).style.width =
        `${percentage}%`;

}


function stopProcessingAnimation() {

    clearInterval(processingTimer);

    document.getElementById(
        "progressBar"
    ).style.width = "100%";

}


/* =========================================
   DISPLAY RESULTS
========================================= */

function displayResults(data) {

    document.getElementById(
        "videoTitle"
    ).textContent =
        data.title || "Video Analysis";


    // document.getElementById(
    //     "summaryContent"
    // ).textContent =
    //     data.summary || "No summary available.";
    document.getElementById(
    "summaryContent"
    ).innerHTML =
        DOMPurify.sanitize(
            marked.parse(data.summary || "No summary available.")
        );

    renderList(
        "actionsContent",
        data.action_items
    );


    renderList(
        "decisionsContent",
        data.key_decisions
    );


    renderList(
        "questionsContent",
        data.open_questions
    );


    document.getElementById(
        "transcriptContent"
    ).textContent =
        data.transcript ||
        "No transcript available.";


    document.getElementById(
        "actionCount"
    ).textContent =
        countItems(data.action_items);


    document.getElementById(
        "decisionCount"
    ).textContent =
        countItems(data.key_decisions);


    document.getElementById(
        "questionCount"
    ).textContent =
        countItems(data.open_questions);


    document.getElementById(
        "sessionBadge"
    ).textContent =
        "● Active session";


    document.getElementById(
        "statusText"
    ).textContent =
        "Analysis ready";


    document.getElementById(
        "statusDot"
    ).style.background =
        "var(--green)";


    document.getElementById(
        "chatMessages"
    ).innerHTML = `

        <div class="message assistant">

            <div class="avatar">
                ✦
            </div>

            <div class="message-content">

                <div class="message-name">
                    MeetMind
                </div>

                <div class="bubble">
                    I've analyzed your video.
                    Ask me anything about the transcript,
                    decisions, action items, or topics discussed.
                </div>

            </div>

        </div>

    `;

}


// function renderList(elementId, content) {

//     const container =
//         document.getElementById(elementId);


//     if (!content) {

//         container.textContent =
//             "No information found.";

//         return;

//     }


//     const text =
//         String(content).trim();


//     if (
//         text.toLowerCase().startsWith(
//             "no action items"
//         ) ||
//         text.toLowerCase().startsWith(
//             "no key decisions"
//         ) ||
//         text.toLowerCase().startsWith(
//             "no open questions"
//         )
//     ) {

//         container.textContent = text;

//         return;

//     }

//     container.innerHTML = marked.parse(text);
//     const items =
//         text
//             .split(/\n(?=\d+[\.\)]|\-|\•)/)
//             .map(item =>
//                 item
//                     .replace(
//                         /^\s*(\d+[\.\)]|\-|\•)\s*/,
//                         ""
//                     )
//                     .trim()
//             )
//             .filter(Boolean);


//     if (items.length === 0) {

//         container.textContent = text;

//         return;

//     }


//     container.innerHTML =
//         items
//             .map(item =>
//                 `<div class="list-item">${escapeHtml(item)}</div>`
//             )
//             .join("");

// }

function renderList(elementId, content) {

    const container =
        document.getElementById(elementId);

    if (!content) {
        container.textContent = "No information found.";
        return;
    }

    const text = String(content).trim();

    if (
        text.toLowerCase().startsWith("no action items") ||
        text.toLowerCase().startsWith("no key decisions") ||
        text.toLowerCase().startsWith("no open questions")
    ) {
        container.textContent = text;
        return;
    }

    container.innerHTML = DOMPurify.sanitize(
        marked.parse(text)
    );
}
function countItems(content) {

    if (!content) {
        return 0;
    }


    const text =
        String(content).trim();


    if (
        text.toLowerCase().includes(
            "no action items"
        ) ||
        text.toLowerCase().includes(
            "no key decisions"
        ) ||
        text.toLowerCase().includes(
            "no open questions"
        )
    ) {

        return 0;

    }


    const matches =
        text.match(
            /(?:^|\n)\s*(?:\d+[\.\)]|\-|\•)/g
        );


    return matches
        ? matches.length
        : 1;

}


/* =========================================
   ENABLE NAVIGATION
========================================= */

function enableSessionNavigation() {

    document
        .getElementById("analysisNav")
        .classList.remove("disabled-nav");


    document
        .getElementById("transcriptNav")
        .classList.remove("disabled-nav");


    document
        .getElementById("chatNav")
        .classList.remove("disabled-nav");

}


navButtons.forEach(
    button => {

        button.addEventListener(
            "click",
            () => {

                const page =
                    button.dataset.page;


                if (
                    button.classList.contains(
                        "disabled-nav"
                    )
                ) {

                    showToast(
                        "Analyze a video first."
                    );

                    return;

                }


                showPage(page);

            }
        );

    }
);


/* =========================================
   CHAT
========================================= */

const chatInput =
    document.getElementById(
        "chatInput"
    );


const sendBtn =
    document.getElementById(
        "sendBtn"
    );


sendBtn.addEventListener(
    "click",
    sendMessage
);


chatInput.addEventListener(
    "keydown",
    event => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            sendMessage();

        }

    }
);


async function sendMessage() {

    const question =
        chatInput.value.trim();


    if (!question) {
        return;
    }


    addMessage(
        question,
        "user"
    );


    chatInput.value = "";

    sendBtn.disabled = true;


    const thinking =
        addMessage(
            "Searching the transcript...",
            "assistant",
            true
        );


    try {

        const response =
            await fetch(
                "/chat",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        question: question

                    })

                }
            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(
                data.error ||
                "Failed to get answer."
            );

        }


        thinking.remove();


        addMessage(
            data.answer,
            "assistant"
        );

    }

    catch (error) {

        thinking.remove();


        addMessage(
            `Error: ${error.message}`,
            "assistant"
        );

    }

    finally {

        sendBtn.disabled = false;

        chatInput.focus();

    }

}


function addMessage(
    text,
    type,
    temporary = false
) {

    const messages =
        document.getElementById(
            "chatMessages"
        );


    const message =
        document.createElement("div");


    message.className =
        `message ${type}`;


    message.innerHTML = `

        <div class="avatar">
            ${type === "user" ? "You" : "✦"}
        </div>

        <div class="message-content">

            <div class="message-name">
                ${type === "user" ? "You" : "MeetMind"}
            </div>

            
            <div class="bubble">
                ${
                    type === "assistant"
                        ? DOMPurify.sanitize(marked.parse(text))
                        : escapeHtml(text)
                }
            </div>

        </div>

    `;


    messages.appendChild(message);


    messages.scrollTop =
        messages.scrollHeight;


    if (temporary) {

        message.classList.add(
            "thinking"
        );

    }


    return message;

}


/* =========================================
   SUGGESTIONS
========================================= */

document
    .querySelectorAll(".suggestions button")
    .forEach(button => {

        button.addEventListener(
            "click",
            () => {

                chatInput.value =
                    button.dataset.question;

                sendMessage();

            }
        );

    });


/* =========================================
   COPY TRANSCRIPT
========================================= */

document
    .getElementById("copyTranscript")
    .addEventListener(
        "click",
        async () => {

            if (!sessionData) {

                showToast(
                    "No transcript available."
                );

                return;

            }


            try {

                await navigator.clipboard.writeText(
                    sessionData.transcript || ""
                );


                showToast(
                    "Transcript copied!"
                );

            }

            catch {

                showToast(
                    "Could not copy transcript."
                );

            }

        }
    );


/* =========================================
   TOAST
========================================= */

function showToast(message) {

    const toast =
        document.getElementById(
            "toast"
        );


    document.getElementById(
        "toastMessage"
    ).textContent =
        message;


    toast.classList.add("show");


    setTimeout(
        () => {

            toast.classList.remove(
                "show"
            );

        },
        2800
    );

}


/* =========================================
   HTML ESCAPE
========================================= */

function escapeHtml(text) {

    const div =
        document.createElement("div");

    div.textContent =
        String(text);

    return div.innerHTML;

}