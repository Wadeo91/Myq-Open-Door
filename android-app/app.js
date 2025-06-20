class MyQGarageApp {
    constructor() {
        this.apiBaseUrl = 'http://localhost:8000';
        this.credentials = null;
        this.recognition = null;
        this.isListening = false;
        
        this.initializeApp();
        this.setupEventListeners();
        this.initializeSpeechRecognition();
    }

    initializeApp() {
        const savedCredentials = localStorage.getItem('myq_credentials');
        if (savedCredentials) {
            this.credentials = JSON.parse(savedCredentials);
            this.showControlSection();
            this.updateStatus();
        }
    }

    setupEventListeners() {
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        document.getElementById('voiceButton').addEventListener('click', () => {
            this.toggleVoiceRecognition();
        });

        document.getElementById('openButton').addEventListener('click', () => {
            this.openGarage();
        });

        document.getElementById('closeButton').addEventListener('click', () => {
            this.closeGarage();
        });

        document.getElementById('refreshButton').addEventListener('click', () => {
            this.updateStatus();
        });

        document.getElementById('logoutButton').addEventListener('click', () => {
            this.logout();
        });
    }

    initializeSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            
            this.recognition.continuous = false;
            this.recognition.interimResults = false;
            this.recognition.lang = 'en-US';

            this.recognition.onstart = () => {
                this.isListening = true;
                this.updateVoiceButton();
                document.getElementById('voiceResult').textContent = 'Listening...';
            };

            this.recognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript.toLowerCase();
                document.getElementById('voiceResult').textContent = `You said: "${transcript}"`;
                this.processVoiceCommand(transcript);
            };

            this.recognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                this.showToast('Voice recognition error: ' + event.error, 'error');
                this.isListening = false;
                this.updateVoiceButton();
            };

            this.recognition.onend = () => {
                this.isListening = false;
                this.updateVoiceButton();
            };
        } else {
            document.getElementById('voiceButton').disabled = true;
            document.getElementById('voiceButtonText').textContent = 'Voice not supported';
            this.showToast('Speech recognition not supported in this browser', 'error');
        }
    }

    toggleVoiceRecognition() {
        if (!this.recognition) {
            this.showToast('Speech recognition not available', 'error');
            return;
        }

        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    }

    updateVoiceButton() {
        const button = document.getElementById('voiceButton');
        const buttonText = document.getElementById('voiceButtonText');
        
        if (this.isListening) {
            button.classList.add('listening');
            buttonText.textContent = 'Listening...';
        } else {
            button.classList.remove('listening');
            buttonText.textContent = 'Tap to Speak';
        }
    }

    processVoiceCommand(transcript) {
        const openCommands = ['open garage door', 'open garage', 'open the garage door', 'open the garage'];
        const closeCommands = ['close garage door', 'close garage', 'close the garage door', 'close the garage'];
        const statusCommands = ['garage status', 'status', 'what is the status', 'garage door status'];

        if (openCommands.some(cmd => transcript.includes(cmd))) {
            this.openGarage();
        } else if (closeCommands.some(cmd => transcript.includes(cmd))) {
            this.closeGarage();
        } else if (statusCommands.some(cmd => transcript.includes(cmd))) {
            this.updateStatus();
        } else {
            this.showToast('Command not recognized. Try "open garage door" or "close garage door"', 'error');
            this.speak('Command not recognized. Try saying open garage door or close garage door.');
        }
    }

    speak(text) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.8;
            utterance.pitch = 1;
            speechSynthesis.speak(utterance);
        }
    }

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        if (!email || !password) {
            this.showToast('Please enter email and password', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json();

            if (response.ok) {
                this.credentials = { email, password };
                localStorage.setItem('myq_credentials', JSON.stringify(this.credentials));
                this.showControlSection();
                this.updateStatus();
                this.showToast('Login successful!', 'success');
                this.speak('Login successful. You can now control your garage door.');
            } else {
                this.showToast(data.detail || 'Login failed', 'error');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showToast('Network error. Please check your connection.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async openGarage() {
        if (!this.credentials) {
            this.showToast('Please login first', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/open`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.credentials),
            });

            const data = await response.json();

            if (response.ok) {
                this.showToast('Garage door opened!', 'success');
                this.speak('Garage door opened successfully.');
                this.updateStatus();
            } else {
                this.showToast(data.detail || 'Failed to open garage door', 'error');
            }
        } catch (error) {
            console.error('Open garage error:', error);
            this.showToast('Network error. Please check your connection.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async closeGarage() {
        if (!this.credentials) {
            this.showToast('Please login first', 'error');
            return;
        }

        this.showLoading(true);

        try {
            const response = await fetch(`${this.apiBaseUrl}/close`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(this.credentials),
            });

            const data = await response.json();

            if (response.ok) {
                this.showToast('Garage door closed!', 'success');
                this.speak('Garage door closed successfully.');
                this.updateStatus();
            } else {
                this.showToast(data.detail || 'Failed to close garage door', 'error');
            }
        } catch (error) {
            console.error('Close garage error:', error);
            this.showToast('Network error. Please check your connection.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async updateStatus() {
        if (!this.credentials) {
            return;
        }

        try {
            const params = new URLSearchParams(this.credentials);
            const response = await fetch(`${this.apiBaseUrl}/status?${params}`);
            const data = await response.json();

            if (response.ok) {
                const statusText = document.getElementById('statusText');
                const statusIndicator = document.getElementById('statusIndicator');
                
                statusText.textContent = data.garage_status.charAt(0).toUpperCase() + data.garage_status.slice(1);
                
                statusIndicator.className = 'status-indicator';
                if (data.garage_status === 'open') {
                    statusIndicator.style.background = 'rgba(76, 175, 80, 0.8)';
                } else if (data.garage_status === 'closed') {
                    statusIndicator.style.background = 'rgba(244, 67, 54, 0.8)';
                } else {
                    statusIndicator.style.background = 'rgba(255, 193, 7, 0.8)';
                }
            }
        } catch (error) {
            console.error('Status update error:', error);
        }
    }

    showControlSection() {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('controlSection').style.display = 'block';
    }

    logout() {
        this.credentials = null;
        localStorage.removeItem('myq_credentials');
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('controlSection').style.display = 'none';
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
        document.getElementById('statusText').textContent = 'Unknown';
        this.showToast('Logged out successfully', 'success');
    }

    showLoading(show) {
        document.getElementById('loadingOverlay').style.display = show ? 'flex' : 'none';
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new MyQGarageApp();
});

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}
