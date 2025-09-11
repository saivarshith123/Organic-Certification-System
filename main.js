const API_BASE_URL = 'http://localhost:5000/api';

let currentUser = null;

function updateUIAfterLogin(user) {
    currentUser = user;
    sessionStorage.setItem('currentUser', JSON.stringify(user));
    
    const loginSection = document.getElementById('login-section');
    const dashboardSection = document.getElementById('dashboard-section');
    if (loginSection) loginSection.classList.add('hidden');
    if (dashboardSection) {
      dashboardSection.classList.remove('hidden');
      document.getElementById('dashboard-title').textContent = `Welcome, ${user.username} (${user.userType})`;
      document.getElementById('dashboard-content').textContent = `You are logged in as a ${user.userType}. Use the navigation links to access your dashboard.`;
    }
    
    const homeLink = document.getElementById('home-link');
    const farmerLink = document.getElementById('farmer-link');
    const certifierLink = document.getElementById('certifier-link');
    const consumerLink = document.getElementById('consumer-link');
    const logoutLink = document.getElementById('logout-link');

    if (homeLink) homeLink.classList.remove('active');
    if (logoutLink) logoutLink.classList.remove('hidden');

    if (farmerLink) farmerLink.classList.add('hidden');
    if (certifierLink) certifierLink.classList.add('hidden');
    if (consumerLink) consumerLink.classList.add('hidden');

    if (user.userType === 'farmer' && farmerLink) {
        farmerLink.classList.remove('hidden');
    } else if (user.userType === 'certifier' && certifierLink) {
        certifierLink.classList.remove('hidden');
    } else if (user.userType === 'consumer' && consumerLink) {
        consumerLink.classList.remove('hidden');
    }
}

function updateUIAfterLogout() {
    currentUser = null;
    sessionStorage.removeItem('currentUser');
    window.location.href = 'index.html';
}

document.addEventListener('DOMContentLoaded', () => {
    const storedUser = sessionStorage.getItem('currentUser');
    if (storedUser) {
        updateUIAfterLogin(JSON.parse(storedUser));
    }

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const statusMessage = document.getElementById('login-status');
            const loginBtn = document.getElementById('login-btn');

            statusMessage.textContent = 'Logging in...';
            statusMessage.className = 'status-message';
            loginBtn.disabled = true;

            try {
                const response = await fetch(`${API_BASE_URL}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });

                const data = await response.json();
                if (response.ok) {
                    updateUIAfterLogin({ username: data.username, userType: data.userType });
                } else {
                    statusMessage.textContent = `Error: ${data.message}`;
                    statusMessage.classList.add('error');
                }
            } catch (error) {
                statusMessage.textContent = 'Error: Could not connect to the backend server.';
                statusMessage.classList.add('error');
            } finally {
                loginBtn.disabled = false;
            }
        });
    }

    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('reg-username').value;
            const password = document.getElementById('reg-password').value;
            const userType = document.querySelector('input[name="reg-user-type"]:checked').value;
            const statusMessage = document.getElementById('register-status');
            const registerBtn = document.getElementById('register-btn');

            statusMessage.textContent = 'Registering...';
            statusMessage.className = 'status-message';
            registerBtn.disabled = true;

            try {
                const response = await fetch(`${API_BASE_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, userType })
                });

                if (response.ok) {
                    statusMessage.textContent = 'Registration successful! Redirecting to login...';
                    statusMessage.classList.add('success');
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 2000);
                } else {
                    const data = await response.json();
                    statusMessage.textContent = `Error: ${data.message}`;
                    statusMessage.classList.add('error');
                }
            } catch (error) {
                statusMessage.textContent = 'Error: Could not connect to the backend server.';
                statusMessage.classList.add('error');
            } finally {
                registerBtn.disabled = false;
            }
        });
    }

    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            updateUIAfterLogout();
        });
    }

    const farmerForm = document.getElementById('farmer-form');
    if (farmerForm) {
        farmerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const productName = document.getElementById('product-name').value;
            const batchId = document.getElementById('batch-id').value;
            const statusMessage = document.getElementById('farmer-status');
            const submitBtn = document.getElementById('farmer-submit-btn');

            statusMessage.textContent = 'Adding product...';
            statusMessage.className = 'status-message';
            submitBtn.disabled = true;

            try {
                const response = await fetch(`${API_BASE_URL}/products`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name: productName, batchId: batchId, owner: currentUser.username })
                });

                if (response.ok) {
                    const data = await response.json();
                    statusMessage.textContent = `Product added with ID: ${data.productId}`;
                    statusMessage.classList.add('success');
                    farmerForm.reset();
                } else {
                    statusMessage.textContent = 'Error: Failed to add product. Is the backend running?';
                    statusMessage.classList.add('error');
                }
            } catch (error) {
                console.error('Error:', error);
                statusMessage.textContent = 'Error: Could not connect to the backend server.';
                statusMessage.classList.add('error');
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

    const certifierDashboard = document.getElementById('certifier-dashboard');
    if (certifierDashboard) {
        async function fetchUncertifiedProducts() {
            const productList = document.getElementById('uncertified-list');
            if (!productList) return;
            productList.innerHTML = '<p style="text-align:center;">Loading uncertified products...</p>';
            try {
                const response = await fetch(`${API_BASE_URL}/uncertified-products`);
                if (response.ok) {
                    const products = await response.json();
                    productList.innerHTML = '';
                    if (products.length === 0) {
                        productList.innerHTML = '<p style="text-align:center;">No products awaiting certification.</p>';
                    } else {
                        products.forEach(product => {
                            const productDiv = document.createElement('div');
                            productDiv.className = 'product-item';
                            productDiv.innerHTML = `
                                <div>
                                    <h3>${product.name}</h3>
                                    <p style="font-size:0.875rem; color:var(--color-text-dim);">ID: ${product.productId}</p>
                                </div>
                                <button onclick="certifyProduct('${product.productId}')"
                                        style="background-color: var(--color-accent-blue); color:white; padding: 0.5rem 1rem; border-radius:0.5rem; cursor:pointer; border:none;">
                                    Certify
                                </button>
                            `;
                            productList.appendChild(productDiv);
                        });
                    }
                } else {
                    productList.innerHTML = `<p class="status-message error">Error: Could not fetch products. Is the backend running?</p>`;
                }
            } catch (error) {
                productList.innerHTML = `<p class="status-message error">Error: Could not connect to the backend server.</p>`;
            }
        }
        fetchUncertifiedProducts(); // Initial fetch
    }

    window.certifyProduct = async (productId) => {
        const certifierStatus = document.getElementById('certifier-status');
        certifierStatus.textContent = 'Certifying product...';
        certifierStatus.className = 'status-message';
        try {
            const response = await fetch(`${API_BASE_URL}/certify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId: productId, certifier: currentUser.username })
            });

            if (response.ok) {
                certifierStatus.textContent = `Product ${productId} successfully certified!`;
                certifierStatus.classList.add('success');
                document.getElementById('uncertified-list').innerHTML = '<p style="text-align:center;">Refreshing list...</p>';
                await fetchUncertifiedProducts();
            } else {
                certifierStatus.textContent = 'Error: Certification failed. Is the backend running?';
                certifierStatus.classList.add('error');
            }
        } catch (error) {
            certifierStatus.textContent = 'Error: Could not connect to the backend server.';
            certifierStatus.classList.add('error');
        }
    };

    const consumerForm = document.getElementById('consumer-form');
    if (consumerForm) {
        consumerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const productId = document.getElementById('search-product-id').value;
            const productDetails = document.getElementById('product-details');
            const consumerStatus = document.getElementById('consumer-status');
            const submitBtn = document.getElementById('consumer-submit-btn');

            productDetails.innerHTML = '';
            productDetails.classList.add('hidden');
            consumerStatus.textContent = 'Searching...';
            consumerStatus.className = 'status-message';
            submitBtn.disabled = true;

            try {
                const response = await fetch(`${API_BASE_URL}/products/${productId}`);
                if (response.ok) {
                    const product = await response.json();
                    consumerStatus.textContent = 'Product found!';
                    consumerStatus.classList.add('success');
                    productDetails.innerHTML = `
                        <h3 style="font-size:1.125rem; font-weight:600; margin-bottom:1rem;">Product Details</h3>
                        <p><strong>Product ID:</strong> ${product.productId}</p>
                        <p><strong>Name:</strong> ${product.name}</p>
                        <p><strong>Farmer:</strong> ${product.farmerId}</p>
                        <p><strong>Status:</strong> <span style="font-weight:600; color:var(--color-accent-blue);">${product.status}</span></p>
                        <h4 style="font-weight:600; margin-top:1rem;">Certification History:</h4>
                        <ul style="list-style-type:disc; margin-left:1.5rem; margin-top:0.5rem;">
                            ${product.certifications ? product.certifications.map(cert => `
                                <li>Certified by ${cert.certifierName} on ${new Date(cert.timestamp).toLocaleDateString()}</li>
                            `).join('') : '<li>No certification history found.</li>'}
                        </ul>
                    `;
                    productDetails.classList.remove('hidden');
                } else {
                    consumerStatus.textContent = 'Error: Product not found.';
                    consumerStatus.classList.add('error');
                    productDetails.classList.add('hidden');
                }
            } catch (error) {
                consumerStatus.textContent = 'Error: Could not connect to the backend server.';
                consumerStatus.classList.add('error');
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

});
