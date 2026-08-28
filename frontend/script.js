// ==========================================
// SALESFLOW AI - COMPLETE SCRIPT.JS
// ==========================================

// ==========================================
// API URLS
// ==========================================

const API_URL = "https://voice-sales-agent-1.onrender.com/chat";
const AGORA_TOKEN_URL = "https://voice-sales-agent-1.onrender.com/agora/token";

const AGORA_CHANNEL = "salesflow";


// ==========================================
// DOM ELEMENTS
// ==========================================

const chatMessages = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const micButton = document.getElementById("micButton");
const voiceStatus = document.getElementById("voiceStatus");


// ==========================================
// AGORA VARIABLES
// ==========================================

let agoraClient = null;
let microphoneTrack = null;
let isAgoraConnected = false;


// ==========================================
// SPEECH RECOGNITION VARIABLES
// ==========================================

const SpeechRecognition =
    window.SpeechRecognition ||
    window.webkitSpeechRecognition;

let recognition = null;
let isListening = false;


// ==========================================
// ADD MESSAGE
// ==========================================

function addMessage(message, sender) {

    if (!chatMessages) {
        console.error("Missing #chatMessages");
        return;
    }

    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${sender}`;

    const bubble = document.createElement("div");
    bubble.className = "message-bubble";

    // Convert basic Markdown to HTML
    let formattedMessage = message
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/^\* (.*)$/gm, "• $1")
        .replace(/\n/g, "<br>");

    bubble.innerHTML = formattedMessage;

    messageDiv.appendChild(bubble);
    chatMessages.appendChild(messageDiv);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ==========================================
// TYPING INDICATOR
// ==========================================

function showTyping() {

    if (!chatMessages) {
        return;
    }

    removeTyping();

    const typingDiv =
        document.createElement("div");

    typingDiv.className = "message ai";

    typingDiv.id = "typingIndicator";

    typingDiv.innerHTML = `
        <div class="message-bubble">
            <div class="typing">
                <span></span>
                <span></span>
                <span></span>
            </div>
        </div>
    `;

    chatMessages.appendChild(typingDiv);

    chatMessages.scrollTop =
        chatMessages.scrollHeight;
}


// ==========================================
// REMOVE TYPING
// ==========================================

function removeTyping() {

    const typing =
        document.getElementById(
            "typingIndicator"
        );

    if (typing) {
        typing.remove();
    }
}


// ==========================================
// SEND TEXT MESSAGE
// ==========================================

async function sendMessage() {

    if (!messageInput) {
        console.error(
            "Missing #messageInput"
        );
        return;
    }

    const message =
        messageInput.value.trim();

    if (!message) {
        return;
    }

    // Show user message
    addMessage(
        message,
        "user"
    );

    // Clear input
    messageInput.value = "";

    // Disable send button
    if (sendButton) {
        sendButton.disabled = true;
    }

    showTyping();

    try {

        const response =
            await fetch(
                API_URL,
                {
                    method: "POST",

                    headers: {
                        "Content-Type":
                            "application/json"
                    },

                    body: JSON.stringify({
                        message: message
                    })
                }
            );

        if (!response.ok) {

            throw new Error(
                `Backend returned HTTP ${response.status}`
            );
        }

        const data =
            await response.json();

        removeTyping();

        if (
            data &&
            typeof data.response === "string" &&
            data.response.trim() !== ""
        ) {

            // Display AI response
            addMessage(
                data.response,
                "ai"
            );

            // Speak AI response
            speakResponse(
                data.response
            );

        } else {

            addMessage(
                "Sorry, I received an empty response from the AI.",
                "ai"
            );
        }

    } catch (error) {

        console.error(
            "Backend connection error:",
            error
        );

        removeTyping();

        addMessage(
            "Sorry, I couldn't connect to the SalesFlow AI server. Please make sure the backend is running on http://127.0.0.1:8000.",
            "ai"
        );

    } finally {

        if (sendButton) {
            sendButton.disabled = false;
        }

        if (messageInput) {
            messageInput.focus();
        }
    }
}


// ==========================================
// SEND SUGGESTION
// ==========================================

function sendSuggestion(message) {

    if (!messageInput) {
        return;
    }

    messageInput.value =
        message;

    sendMessage();
}


// ==========================================
// CLEAR CHAT
// ==========================================

function clearChat() {

    if (!chatMessages) {
        return;
    }

    chatMessages.innerHTML = `
        <div class="welcome-message">

            <div class="welcome-icon">
                🤖
            </div>

            <h2>
                Welcome to SalesFlow AI
            </h2>

            <p>
                I'm your AI sales assistant. I can help you
                understand our CRM, explore pricing, capture
                your requirements, and schedule a meeting.
            </p>

            <div class="suggestions">

                <button
                    type="button"
                    onclick="sendSuggestion('Tell me about SalesFlow CRM')"
                >
                    📦 Tell me about the CRM
                </button>

                <button
                    type="button"
                    onclick="sendSuggestion('What pricing plans do you offer?')"
                >
                    💰 Show me pricing
                </button>

                <button
                    type="button"
                    onclick="sendSuggestion('I want to schedule a meeting')"
                >
                    📅 Book a meeting
                </button>

            </div>

        </div>
    `;

    // Stop AI speech
    if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
    }
}


// ==========================================
// ENTER KEY
// ==========================================

function handleKeyPress(event) {

    if (
        event.key === "Enter" &&
        !event.shiftKey
    ) {

        event.preventDefault();

        sendMessage();
    }
}


// ==========================================
// TEXT TO SPEECH
// ==========================================

function speakResponse(text) {

    if (!("speechSynthesis" in window)) {
        console.warn("Speech synthesis unavailable.");
        return;
    }

    // Stop previous speech
    window.speechSynthesis.cancel();

    // ==========================================
    // CLEAN MARKDOWN FOR VOICE
    // ==========================================

    let cleanText = String(text);

    // Remove bold markdown **
    cleanText = cleanText.replace(/\*\*/g, "");

    // Remove single *
    cleanText = cleanText.replace(/\*/g, "");

    // Remove markdown headings
    cleanText = cleanText.replace(/^#{1,6}\s*/gm, "");

    // Remove bullet characters
    cleanText = cleanText.replace(/^[\s]*[-•+]\s+/gm, "");

    // Remove numbered-list formatting
    cleanText = cleanText.replace(/^\s*\d+\.\s+/gm, "");

    // Remove backticks
    cleanText = cleanText.replace(/`/g, "");

    // Remove underscores
    cleanText = cleanText.replace(/_/g, "");

    // Remove HTML tags if any
    cleanText = cleanText.replace(/<[^>]*>/g, "");

    // Replace multiple spaces
    cleanText = cleanText.replace(/\s+/g, " ");

    // Trim
    cleanText = cleanText.trim();

    console.log("Original AI response:", text);
    console.log("Clean text for voice:", cleanText);

    if (!cleanText) {
        return;
    }

    // ==========================================
    // CREATE SPEECH
    // ==========================================

    const speech =
        new SpeechSynthesisUtterance(cleanText);

    speech.lang = "en-US";
    speech.rate = 1.05;
    speech.pitch = 1.05;
    speech.volume = 1;

    // ==========================================
    // GET AVAILABLE VOICES
    // ==========================================

    const voices =
        window.speechSynthesis.getVoices();

    console.log("Available voices:");

    voices.forEach(function(voice) {
        console.log(
            voice.name,
            "|",
            voice.lang
        );
    });

    // ==========================================
    // FIND FEMALE ENGLISH VOICE
    // ==========================================

    const femaleVoice =
        voices.find(function(voice) {

            const name =
                voice.name.toLowerCase();

            const lang =
                voice.lang.toLowerCase();

            return (
                lang.startsWith("en") &&
                (
                    name.includes("zira") ||
                    name.includes("samantha") ||
                    name.includes("karen") ||
                    name.includes("victoria") ||
                    name.includes("susan") ||
                    name.includes("moira") ||
                    name.includes("female")
                )
            );
        });

    // ==========================================
    // USE FEMALE VOICE
    // ==========================================

    if (femaleVoice) {

        speech.voice =
            femaleVoice;

        console.log(
            "Female voice selected:",
            femaleVoice.name,
            femaleVoice.lang
        );

    } else {

        // ==========================================
        // FALLBACK ENGLISH VOICE
        // ==========================================

        const englishVoice =
            voices.find(function(voice) {

                return voice.lang
                    .toLowerCase()
                    .startsWith("en");

            });

        if (englishVoice) {

            speech.voice =
                englishVoice;

            console.log(
                "Fallback English voice:",
                englishVoice.name,
                englishVoice.lang
            );

        } else {

            console.warn(
                "No English voice found."
            );
        }
    }

    // ==========================================
    // SPEAK
    // ==========================================

    window.speechSynthesis.speak(
        speech
    );
}

// ==========================================
// VOICE STATUS
// ==========================================

function updateVoiceStatus(status) {

    if (!voiceStatus) {
        return;
    }

    voiceStatus.textContent =
        `Voice: ${status}`;
}


// ==========================================
// INITIALIZE AGORA
// ==========================================

function initializeAgora() {

    if (
        typeof AgoraRTC === "undefined"
    ) {

        console.error(
            "Agora Web SDK was not loaded."
        );

        updateVoiceStatus(
            "SDK unavailable"
        );

        return false;
    }

    // Prevent duplicate clients
    if (agoraClient) {
        return true;
    }

    agoraClient =
        AgoraRTC.createClient({
            mode: "rtc",
            codec: "vp8"
        });


    // ======================================
    // REMOTE USER PUBLISHED
    // ======================================

    agoraClient.on(
        "user-published",
        async (user, mediaType) => {

            try {

                await agoraClient.subscribe(
                    user,
                    mediaType
                );

                if (
                    mediaType === "audio" &&
                    user.audioTrack
                ) {

                    user.audioTrack.play();

                    console.log(
                        "Remote audio playing."
                    );
                }

            } catch (error) {

                console.error(
                    "Agora subscribe error:",
                    error
                );
            }
        }
    );


    // ======================================
    // REMOTE USER UNPUBLISHED
    // ======================================

    agoraClient.on(
        "user-unpublished",
        (user, mediaType) => {

            console.log(
                "Agora user unpublished:",
                user.uid,
                mediaType
            );
        }
    );


    // ======================================
    // REMOTE USER LEFT
    // ======================================

    agoraClient.on(
        "user-left",
        user => {

            console.log(
                "Agora user left:",
                user.uid
            );
        }
    );


    console.log(
        "Agora client initialized."
    );

    return true;
}


// ==========================================
// START AGORA VOICE
// ==========================================

async function startAgoraVoice() {

    // If already connected,
    // disconnect Agora
    if (isAgoraConnected) {

        await stopAgoraVoice();

        return;
    }


    // Initialize Agora
    if (!initializeAgora()) {
        return;
    }


    try {

        updateVoiceStatus(
            "Connecting..."
        );


        if (micButton) {
            micButton.disabled = true;
        }


        // ======================================
        // GET FRESH TOKEN
        // ======================================

        const response =
            await fetch(
                AGORA_TOKEN_URL,
                {
                    method: "GET",

                    cache: "no-store",

                    headers: {
                        "Cache-Control":
                            "no-cache"
                    }
                }
            );


        if (!response.ok) {

            throw new Error(
                `Token server returned HTTP ${response.status}`
            );
        }


        const tokenData =
            await response.json();


        // ======================================
        // CHECK TOKEN
        // ======================================

        if (tokenData.error) {

            throw new Error(
                tokenData.error
            );
        }


        if (
            !tokenData.appId ||
            !tokenData.token ||
            !tokenData.channel
        ) {

            throw new Error(
                "Invalid Agora token response."
            );
        }


        console.log(
            "Fresh Agora token received."
        );


        console.log(
            "App ID:",
            tokenData.appId
        );

        console.log(
            "Channel:",
            tokenData.channel
        );

        console.log(
            "UID:",
            tokenData.uid
        );


        // ======================================
        // JOIN AGORA CHANNEL
        // ======================================

        await agoraClient.join(
            tokenData.appId,
            tokenData.channel,
            tokenData.token,
            tokenData.uid
        );


        console.log(
            "Successfully joined Agora channel."
        );


        // ======================================
        // CREATE MICROPHONE
        // ======================================

        microphoneTrack =
            await AgoraRTC.createMicrophoneAudioTrack();


        console.log(
            "Microphone created."
        );


        // ======================================
        // PUBLISH MICROPHONE
        // ======================================

        await agoraClient.publish(
            [microphoneTrack]
        );


        console.log(
            "Microphone published."
        );


        isAgoraConnected = true;


        updateVoiceStatus(
            "Connected 🎤"
        );


        if (micButton) {

            micButton.textContent =
                "🔴";

            micButton.title =
                "Start/Stop voice input";

            micButton.classList.add(
                "active"
            );
        }


        addMessage(
            "Voice conversation connected. Your microphone is now active.",
            "ai"
        );


    } catch (error) {

        console.error(
            "Agora connection error:",
            error
        );


        updateVoiceStatus(
            "Connection failed"
        );


        addMessage(
            `Agora voice connection failed: ${error.message}`,
            "ai"
        );


        // ======================================
        // CLEAN MICROPHONE
        // ======================================

        if (microphoneTrack) {

            try {
                microphoneTrack.stop();
                microphoneTrack.close();
            } catch (e) {
                console.error(
                    "Microphone cleanup error:",
                    e
                );
            }

            microphoneTrack = null;
        }


        // ======================================
        // LEAVE AGORA
        // ======================================

        try {

            if (agoraClient) {

                await agoraClient.leave();
            }

        } catch (leaveError) {

            console.error(
                "Agora leave error:",
                leaveError
            );
        }


        isAgoraConnected = false;


        if (micButton) {

            micButton.textContent =
                "🎤";

            micButton.classList.remove(
                "active"
            );
        }


    } finally {

        if (micButton) {
            micButton.disabled = false;
        }
    }
}


// ==========================================
// STOP AGORA VOICE
// ==========================================

async function stopAgoraVoice() {

    try {

        updateVoiceStatus(
            "Disconnecting..."
        );


        // Stop microphone
        if (microphoneTrack) {

            microphoneTrack.stop();

            microphoneTrack.close();

            microphoneTrack = null;
        }


        // Leave channel
        if (agoraClient) {

            await agoraClient.leave();
        }


        isAgoraConnected = false;


        // Stop speech recognition too
        if (
            recognition &&
            isListening
        ) {

            try {
                recognition.stop();
            } catch (e) {
                console.warn(
                    "Speech recognition stop:",
                    e
                );
            }

            isListening = false;
        }


        updateVoiceStatus(
            "Not connected"
        );


        if (micButton) {

            micButton.textContent =
                "🎤";

            micButton.title =
                "Start voice conversation";

            micButton.classList.remove(
                "active"
            );
        }


        addMessage(
            "Voice conversation disconnected.",
            "ai"
        );


        console.log(
            "Agora voice disconnected."
        );


    } catch (error) {

        console.error(
            "Agora disconnect error:",
            error
        );

        updateVoiceStatus(
            "Not connected"
        );
    }
}


// ==========================================
// INITIALIZE SPEECH RECOGNITION
// ==========================================

function initializeSpeechRecognition() {

    if (!SpeechRecognition) {

        console.warn(
            "Speech Recognition is not supported in this browser."
        );

        return false;
    }


    if (recognition) {
        return true;
    }


    recognition =
        new SpeechRecognition();


    // Single voice command
    recognition.continuous = false;


    // Return final result only
    recognition.interimResults = false;


    // English speech
    recognition.lang = "en-US";


    // ======================================
    // SPEECH START
    // ======================================

    recognition.onstart =
        function () {

            isListening = true;


            updateVoiceStatus(
                "Listening 🎤"
            );


            if (micButton) {

                micButton.textContent =
                    "🔴";

                micButton.classList.add(
                    "active"
                );
            }


            console.log(
                "Speech recognition started."
            );
        };


    // ======================================
    // SPEECH RESULT
    // ======================================

    recognition.onresult =
        function (event) {

            if (
                !event.results ||
                !event.results.length
            ) {
                return;
            }


            const transcript =
                event.results[0][0]
                    .transcript
                    .trim();


            console.log(
                "Voice transcript:",
                transcript
            );


            if (!transcript) {
                return;
            }


            // Put speech into input
            if (messageInput) {

                messageInput.value =
                    transcript;
            }


            // Automatically send to backend
            sendMessage();
        };


    // ======================================
    // SPEECH ERROR
    // ======================================

    recognition.onerror =
        function (event) {

            console.error(
                "Speech recognition error:",
                event.error
            );


            isListening = false;


            if (
                event.error ===
                "not-allowed"
            ) {

                addMessage(
                    "Microphone permission was denied. Please allow microphone access in Chrome.",
                    "ai"
                );

            } else if (
                event.error ===
                "no-speech"
            ) {

                console.log(
                    "No speech detected."
                );

            } else if (
                event.error ===
                "network"
            ) {

                addMessage(
                    "Speech recognition network error. Please check your internet connection.",
                    "ai"
                );
            }


            updateVoiceStatus(
                isAgoraConnected
                    ? "Connected 🎤"
                    : "Not connected"
            );


            if (micButton) {

                micButton.textContent =
                    isAgoraConnected
                        ? "🔴"
                        : "🎤";
            }
        };


    // ======================================
    // SPEECH END
    // ======================================

    recognition.onend =
        function () {

            isListening = false;


            updateVoiceStatus(
                isAgoraConnected
                    ? "Connected 🎤"
                    : "Not connected"
            );


            if (micButton) {

                micButton.textContent =
                    isAgoraConnected
                        ? "🔴"
                        : "🎤";
            }


            console.log(
                "Speech recognition ended."
            );
        };


    return true;
}


// ==========================================
// START VOICE INPUT
// ==========================================

async function startVoiceInput() {

    // ======================================
    // IF CURRENTLY LISTENING
    // STOP LISTENING
    // ======================================

    if (isListening) {

        try {

            recognition.stop();

        } catch (error) {

            console.error(
                "Speech stop error:",
                error
            );
        }

        return;
    }


    // ======================================
    // CONNECT AGORA FIRST
    // ======================================

    if (!isAgoraConnected) {

        await startAgoraVoice();


        if (!isAgoraConnected) {
            return;
        }
    }


    // ======================================
    // INITIALIZE SPEECH RECOGNITION
    // ======================================

    if (!recognition) {

        const initialized =
            initializeSpeechRecognition();


        if (!initialized) {

            addMessage(
                "Voice recognition is not supported in this browser. Please use Google Chrome.",
                "ai"
            );

            return;
        }
    }


    // ======================================
    // START LISTENING
    // ======================================

    try {

        recognition.start();

    } catch (error) {

        console.error(
            "Could not start speech recognition:",
            error
        );


        // If already started,
        // don't show duplicate error
        if (
            error.name !==
            "InvalidStateError"
        ) {

            addMessage(
                "Could not start voice recognition. Please try again.",
                "ai"
            );
        }
    }
}


// ==========================================
// MICROPHONE BUTTON
// ==========================================

if (micButton) {

    micButton.addEventListener(
        "click",
        startVoiceInput
    );
}


// ==========================================
// SEND BUTTON
// ==========================================

if (sendButton) {

    sendButton.addEventListener(
        "click",
        sendMessage
    );
}


// ==========================================
// TEXT INPUT
// ==========================================

if (messageInput) {

    messageInput.addEventListener(
        "keydown",
        handleKeyPress
    );
}


// ==========================================
// PAGE VISIBILITY
// ==========================================

document.addEventListener(
    "visibilitychange",
    function () {

        if (
            document.hidden &&
            isListening &&
            recognition
        ) {

            try {
                recognition.stop();
            } catch (error) {
                console.warn(
                    "Speech recognition stop:",
                    error
                );
            }
        }
    }
);


// ==========================================
// INITIALIZATION
// ==========================================

console.log(
    "================================="
);

console.log(
    "SalesFlow AI frontend loaded."
);

console.log(
    "================================="
);


// Initialize Agora
initializeAgora();


// Initialize speech recognition
if (SpeechRecognition) {

    console.log(
        "Browser Speech Recognition available."
    );

} else {

    console.warn(
        "Browser Speech Recognition unavailable."
    );
}


// ==========================================
// FINAL STATUS
// ==========================================

updateVoiceStatus(
    "Not connected"
);
if ("speechSynthesis" in window) {
    window.speechSynthesis.onvoiceschanged = function () {
        const voices = window.speechSynthesis.getVoices();

        console.log("Available voices:");

        voices.forEach(voice => {
            console.log(
                voice.name,
                voice.lang
            );
        });
    };
}