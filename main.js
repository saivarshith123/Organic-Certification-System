const API_BASE_URL = 'http://localhost:5000/api';
const contractAddress = "YOUR_CONTRACT_ADDRESS"; // Replace with your contract address
const contractABI = []; // Replace with your contract ABI

let currentUser = null;
let provider;
let signer;
let contract;

async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            provider = new ethers.providers.Web3Provider(window.ethereum);
            signer = provider.getSigner();
            contract = new ethers.Contract(contractAddress, contractABI, signer);
            const userAddress = await signer.getAddress();
            // You can now use userAddress for role checking or other purposes
            console.log("Connected with address:", userAddress);
        } catch (error) {
            console.error("User rejected request");
        }
    } else {
        console.error("MetaMask is not installed!");
    }
}


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
    connectWallet(); // Connect to MetaMask on page load

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
                // Smart Contract Interaction
                const tx = await contract.addProduct(productName, batchId);
                await tx.wait(); // Wait for the transaction to be mined

                statusMessage.textContent = `Product added with transaction hash: ${tx.hash}`;
                statusMessage.classList.add('success');
                farmerForm.reset();

            } catch (error) {
                console.error('Error:', error);
                statusMessage.textContent = 'Error: Could not add product to the blockchain.';
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
                // Smart Contract Interaction
                const productIds = await contract.getUncertifiedProductIds();

                productList.innerHTML = '';
                if (productIds.length === 0) {
                    productList.innerHTML = '<p style="text-align:center;">No products awaiting certification.</p>';
                } else {
                    for (const id of productIds) {
                        const product = await contract.getProduct(id);
                        const productDiv = document.createElement('div');
                        productDiv.className = 'product-item';
                        productDiv.innerHTML = `
                            <div>
                                <h3>${product.name}</h3>
                                <p style="font-size:0.875rem; color:var(--color-text-dim);">ID: ${product.productId}</p>
                            </div>
                            <button onclick="certifyProduct(${product.productId})"
                                    style="background-color: var(--color-accent-blue); color:white; padding: 0.5rem 1rem; border-radius:0.5rem; cursor:pointer; border:none;">
                                Certify
                            </button>
                        `;
                        productList.appendChild(productDiv);
                    }
                }
            } catch (error) {
                productList.innerHTML = `<p class="status-message error">Error: Could not fetch products from the blockchain.</p>`;
            }
        }
        fetchUncertifiedProducts(); // Initial fetch
    }

    window.certifyProduct = async (productId) => {
        const certifierStatus = document.getElementById('certifier-status');
        certifierStatus.textContent = 'Certifying product...';
        certifierStatus.className = 'status-message';
        try {
            // Smart Contract Interaction
            const tx = await contract.certifyProduct(productId);
            await tx.wait();

            certifierStatus.textContent = `Product ${productId} successfully certified!`;
            certifierStatus.classList.add('success');
            document.getElementById('uncertified-list').innerHTML = '<p style="text-align:center;">Refreshing list...</p>';
            await fetchUncertifiedProducts();
        } catch (error) {
            certifierStatus.textContent = 'Error: Certification failed.';
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
                // Smart Contract Interaction
                const product = await contract.getProduct(productId);

                consumerStatus.textContent = 'Product found!';
                consumerStatus.classList.add('success');
                productDetails.innerHTML = `
                    <h3 style="font-size:1.125rem; font-weight:600; margin-bottom:1rem;">Product Details</h3>
                    <p><strong>Product ID:</strong> ${product.productId}</p>
                    <p><strong>Name:</strong> ${product.name}</p>
                    <p><strong>Farmer:</strong> ${product.owner}</p>
                    <p><strong>Status:</strong> <span style="font-weight:600; color:var(--color-accent-blue);">${product.status === 0 ? 'Uncertified' : 'Certified'}</span></p>
                    <h4 style="font-weight:600; margin-top:1rem;">Certification History:</h4>
                    <p>Certified by ${product.certifier} on ${new Date(product.certificationTimestamp * 1000).toLocaleDateString()}</p>
                `;
                productDetails.classList.remove('hidden');

            } catch (error) {
                consumerStatus.textContent = 'Error: Product not found.';
                consumerStatus.classList.add('error');
                productDetails.classList.add('hidden');
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

});
