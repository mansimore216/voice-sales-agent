const API_URL = "http://127.0.0.1:8000/chat";

const chatMessages = document.getElementById("chatMessages");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");


function addMessage(message, sender) {

    const messageDiv = document.createElement("div");

    messageDiv.className = `message ${sender}`;

    const bubble = document.createElement("div");

    bubble.className = "message-bubble";

    bubble.textContent = message;

    messageDiv.appendChild(bubble);

    chatMessages.appendChild(messageDiv);

    chatMessages.scrollTop = chatMessages.scrollHeight;
}


function showTyping() {

    const typingDiv = document.createElement("div");

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

    chatMessages.scrollTop = chatMessages.scrollHeight;
}


function removeTyping() {

    const typing = document.getElementById("typingIndicator");

    if (typing) {
        typing.remove();
    }
}


async function sendMessage() {

    const message = messageInput.value.trim();

    if (!message) {
        return;
    }

    addMessage(message, "user");

    messageInput.value = "";

    sendButton.disabled = true;

    showTyping();

    try {

        const response = await fetch(API_URL, {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: message
            })

        });


        if (!response.ok) {

            throw new Error(
                `Server returned ${response.status}`
            );

        }


        const data = await response.json();

        removeTyping();

        addMessage(data.response, "ai");


    } catch (error) {

        console.error("Error:", error);

        removeTyping();

        addMessage(
            "Sorry, I couldn't connect to the SalesFlow AI server. Please make sure the backend is running.",
            "ai"
        );

    } finally {

        sendButton.disabled = false;

        messageInput.focus();

    }
}


function sendSuggestion(message) {

    messageInput.value = message;

    sendMessage();

}


function clearChat() {

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

                <button onclick="sendSuggestion('Tell me about SalesFlow CRM')">
                    📦 Tell me about the CRM
                </button>

                <button onclick="sendSuggestion('What pricing plans do you offer?')">
                    💰 Show me pricing
                </button>

                <button onclick="sendSuggestion('I want to schedule a meeting')">
                    📅 Book a meeting
                </button>

            </div>

        </div>

    `;
}


function handleKeyPress(event) {

    if (event.key === "Enter" && !event.shiftKey) {

        event.preventDefault();

        sendMessage();

    }

}