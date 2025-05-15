document.addEventListener('DOMContentLoaded', function() {
    // Check for API key connection status on load
    checkApiConnection();

    // Handle API key connect button
    const connectButton = document.getElementById('connectButton');
    if (connectButton) {
        connectButton.addEventListener('click', function() {
            const apiKey = document.getElementById('apiKeyInput').value.trim();
            if (!apiKey) {
                showApiKeyMessage('Please enter your OpenAI API key.', 'alert-danger');
                return;
            }
            
            connectApiKey(apiKey);
        });
    }

    // Handle API key disconnect button
    const disconnectButton = document.getElementById('disconnectButton');
    if (disconnectButton) {
        disconnectButton.addEventListener('click', function() {
            disconnectApiKey();
        });
    }
    
    // Add test form event listeners
    setupTestForm();
});

// Function to check if API key is connected
function checkApiConnection() {
    // Send request to check API connection
    fetch('/api/connect', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ use_env_key: true }) // Try to use env key if available
    })
    .then(response => response.json())
    .then(data => {
        updateApiConnectionUI(data.success, data.models);
    })
    .catch(error => {
        console.error('Error checking API connection:', error);
        updateApiConnectionUI(false);
    });
}

// Function to connect API key
function connectApiKey(apiKey) {
    const connectButton = document.getElementById('connectButton');
    const originalHtml = connectButton.innerHTML;
    
    // Show loading state
    connectButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Connecting...';
    connectButton.disabled = true;
    
    // Send request to connect API key
    fetch('/api/connect', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ api_key: apiKey })
    })
    .then(response => response.json())
    .then(data => {
        // Reset button state
        connectButton.innerHTML = originalHtml;
        connectButton.disabled = false;
        
        if (data.success) {
            showApiKeyMessage('API key connected successfully!', 'alert-success');
            updateApiConnectionUI(true, data.models);
            
            // Close modal after a short delay
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('apiKeyModal'));
                if (modal) {
                    modal.hide();
                }
            }, 1500);
        } else {
            showApiKeyMessage(`Failed to connect API key: ${data.message}`, 'alert-danger');
            updateApiConnectionUI(false);
        }
    })
    .catch(error => {
        // Reset button state
        connectButton.innerHTML = originalHtml;
        connectButton.disabled = false;
        
        showApiKeyMessage(`Error: ${error.message}`, 'alert-danger');
        updateApiConnectionUI(false);
    });
}

// Function to disconnect API key
function disconnectApiKey() {
    fetch('/api/disconnect', {
        method: 'POST'
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showApiKeyMessage('API key disconnected.', 'alert-info');
            updateApiConnectionUI(false);
            
            // Close modal after a short delay
            setTimeout(() => {
                const modal = bootstrap.Modal.getInstance(document.getElementById('apiKeyModal'));
                if (modal) {
                    modal.hide();
                }
            }, 1500);
        }
    })
    .catch(error => {
        showApiKeyMessage(`Error: ${error.message}`, 'alert-danger');
    });
}

// Function to show API key message
function showApiKeyMessage(message, className) {
    const messageEl = document.getElementById('apiKeyMessage');
    if (messageEl) {
        messageEl.textContent = message;
        messageEl.className = `alert ${className}`;
        messageEl.classList.remove('d-none');
    }
}

// Function to update UI based on API connection status
function updateApiConnectionUI(connected, models = []) {
    const apiConnected = document.getElementById('apiConnected');
    const apiDisconnected = document.getElementById('apiDisconnected');
    const apiConnectionWarning = document.getElementById('apiConnectionWarning');
    const testForm = document.getElementById('testForm');
    const modelSelect = document.getElementById('modelSelect');
    
    if (connected) {
        // Update connection status indicators
        apiConnected.classList.remove('d-none');
        apiConnected.classList.add('d-block');
        apiDisconnected.classList.add('d-none');
        
        // Update form visibility
        if (apiConnectionWarning) {
            apiConnectionWarning.classList.add('d-none');
        }
        if (testForm) {
            testForm.classList.remove('d-none');
        }
        
        // Update model selection if provided
        if (models.length > 0 && modelSelect) {
            // Clear existing options
            modelSelect.innerHTML = '';
            
            // Add new options
            models.forEach(model => {
                const option = document.createElement('option');
                option.value = model;
                option.textContent = model;
                // Make gpt-4o the default selection if available
                if (model === 'gpt-4o') {
                    option.textContent = 'gpt-4o (latest)';
                    option.selected = true;
                }
                modelSelect.appendChild(option);
            });
        }
    } else {
        // Update connection status indicators
        apiConnected.classList.add('d-none');
        apiConnected.classList.remove('d-block');
        apiDisconnected.classList.remove('d-none');
        
        // Update form visibility
        if (apiConnectionWarning) {
            apiConnectionWarning.classList.remove('d-none');
        }
        if (testForm) {
            testForm.classList.add('d-none');
        }
    }
}

// Function to set up test form functionality
function setupTestForm() {
    const testForm = document.getElementById('testForm');
    if (!testForm) return;
    
    // Save test case checkbox handling
    const saveTestCase = document.getElementById('saveTestCase');
    const testNameField = document.getElementById('testNameField');
    
    if (saveTestCase && testNameField) {
        saveTestCase.addEventListener('change', function() {
            if (this.checked) {
                testNameField.classList.remove('d-none');
            } else {
                testNameField.classList.add('d-none');
            }
        });
    }
    
    // Clear form button
    const clearFormButton = document.getElementById('clearFormButton');
    if (clearFormButton) {
        clearFormButton.addEventListener('click', function() {
            testForm.reset();
            
            // Hide test name field if save is unchecked
            if (saveTestCase && !saveTestCase.checked && testNameField) {
                testNameField.classList.add('d-none');
            }
            
            // Hide results
            const testResultsCard = document.getElementById('testResultsCard');
            if (testResultsCard) {
                testResultsCard.classList.add('d-none');
            }
        });
    }
    
    // Form submission
    testForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form values
        const formData = {
            model: document.getElementById('modelSelect').value,
            prompt: document.getElementById('promptInput').value,
            system_message: document.getElementById('systemMessage').value,
            temperature: parseFloat(document.getElementById('temperature').value),
            max_tokens: parseInt(document.getElementById('maxTokens').value),
            top_p: parseFloat(document.getElementById('topP').value),
            frequency_penalty: parseFloat(document.getElementById('frequencyPenalty').value),
            presence_penalty: parseFloat(document.getElementById('presencePenalty').value),
            json_response: document.getElementById('jsonResponse').checked,
            save: document.getElementById('saveTestCase').checked
        };
        
        // Add name if saving
        if (formData.save) {
            formData.name = document.getElementById('testName').value || 'Unnamed Test';
        }
        
        // Validate form
        if (!formData.prompt) {
            alert('Please enter a prompt.');
            return;
        }
        
        if (formData.save && !formData.name) {
            alert('Please enter a name for this test case.');
            return;
        }
        
        // Show loading state
        const runButton = document.getElementById('runTestButton');
        const originalHtml = runButton.innerHTML;
        runButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Running...';
        runButton.disabled = true;
        
        // Submit form data
        fetch('/api/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        .then(response => response.json())
        .then(data => {
            // Reset button state
            runButton.innerHTML = originalHtml;
            runButton.disabled = false;
            
            if (data.success) {
                displayTestResults(data);
            } else {
                displayTestError(data.message);
            }
        })
        .catch(error => {
            // Reset button state
            runButton.innerHTML = originalHtml;
            runButton.disabled = false;
            
            displayTestError(error.message);
        });
    });
}

// Function to display test results
function displayTestResults(data) {
    // Show results card
    const testResultsCard = document.getElementById('testResultsCard');
    testResultsCard.classList.remove('d-none');
    
    // Update response time
    const responseTimeDisplay = document.getElementById('responseTimeDisplay');
    responseTimeDisplay.textContent = `${data.duration_ms} ms`;
    
    // Handle error or show response
    const responseError = document.getElementById('responseError');
    const responseContent = document.getElementById('responseContent');
    
    if (data.status === 'failed' || data.error_message) {
        responseError.textContent = data.error_message || 'An error occurred during the test.';
        responseError.classList.remove('d-none');
        responseContent.textContent = '';
    } else {
        responseError.classList.add('d-none');
        
        // Format and display response content
        if (typeof data.response === 'object') {
            responseContent.textContent = JSON.stringify(data.response, null, 2);
        } else if (data.response) {
            responseContent.textContent = data.response;
        } else {
            responseContent.textContent = 'No response data available.';
        }
    }
    
    // Update token usage
    document.getElementById('promptTokens').textContent = data.usage.prompt_tokens;
    document.getElementById('completionTokens').textContent = data.usage.completion_tokens;
    document.getElementById('totalTokens').textContent = data.usage.total_tokens;
    
    // Update token chart
    if (typeof initTokenChart === 'function') {
        initTokenChart(data.usage.prompt_tokens, data.usage.completion_tokens);
    }
    
    // Scroll to results
    testResultsCard.scrollIntoView({ behavior: 'smooth' });
}

// Function to display test error
function displayTestError(errorMessage) {
    // Show results card
    const testResultsCard = document.getElementById('testResultsCard');
    testResultsCard.classList.remove('d-none');
    
    // Show error message
    const responseError = document.getElementById('responseError');
    responseError.textContent = errorMessage;
    responseError.classList.remove('d-none');
    
    // Clear response content
    const responseContent = document.getElementById('responseContent');
    responseContent.textContent = '';
    
    // Reset token usage
    document.getElementById('promptTokens').textContent = '0';
    document.getElementById('completionTokens').textContent = '0';
    document.getElementById('totalTokens').textContent = '0';
    
    // Update token chart
    if (typeof initTokenChart === 'function') {
        initTokenChart(0, 0);
    }
    
    // Scroll to results
    testResultsCard.scrollIntoView({ behavior: 'smooth' });
}
