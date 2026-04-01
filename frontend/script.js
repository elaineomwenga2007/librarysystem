console.log("JS IS CONNECTED");

let users = [];
let currentUser = null;
let currentRole ='';
let historyData = [];
let currentBooks =[];

const API_BASE = "http://127.0.0.1:5000";

async function fetchBooks() {
  try {
    const res = await fetch(`${API_BASE}/books`);

    const text = await res.text(); // get raw response

    try {
      const data = JSON.parse(text); // try parsing

      currentBooks = data.map(book => ({
        id: book.BookID,
        title: book.Book_Title,
        available: book.NumberOfCopies > 0,
        copies: book.NumberOfCopies
      }));

      renderBooks(currentBooks);

    } catch{
      console.error("Not JSON:", text);
      showMessage("Server error (not JSON)", "error");
    }

  } catch {
    showMessage("Cannot connect to server", "error");
  }
}

// ================= UI MESSAGE =================
function showMessage(message, type = "success") {
  const msg = document.createElement("div");
  msg.innerText = message;

  msg.style.position = "fixed";
  msg.style.top = "20px";
  msg.style.right = "20px";
  msg.style.padding = "15px 20px";
  msg.style.borderRadius = "8px";
  msg.style.color = "white";
  msg.style.zIndex = "9999";
  msg.style.fontWeight = "bold";
  msg.style.background = type === "error" ? "#e74c3c" : "#2ecc71";

  document.body.appendChild(msg);

  setTimeout(() => msg.remove(), 3000);
}

// ================= AUTH =================
function showLogin(role) {
  currentRole = role;
  hideAll();
  document.getElementById('loginPage').classList.remove('hidden');
  document.getElementById('loginError').innerText = '';
  document.getElementById('username').value = '';
  document.getElementById('password').value = '';

  const signupBtn = document.querySelector('#loginPage .secondary');

  if (role === 'librarian') {
    signupBtn.style.display = 'none'; 
  } else {
    signupBtn.style.display = 'block'; // ✅ show for borrower
  }
  document.getElementById('loginTitle').innerText =
  role === 'librarian' ? 'Librarian Login' : 'Borrower Login';
}

function showSignup() {
  hideAll();
  document.getElementById('signupPage').classList.remove('hidden');
}

function signup() {
  const firstName = document.getElementById('firstName').value.trim();
  const lastName = document.getElementById('lastName').value.trim();
  const email = document.getElementById('email').value.trim();
  const borrowerType = document.getElementById('borrowerType').value;
  const username = document.getElementById('newUser').value.trim();
  const password = document.getElementById('newPass').value.trim();
  const confirm = document.getElementById('confirmPass').value.trim();

  if (!firstName || !lastName || !email || !borrowerType || !username || !password || !confirm) {
    document.getElementById('signupError').innerText = 'Please fill all fields.';
    return;
  }

  if (password !== confirm) {
    document.getElementById('signupError').innerText = 'Passwords do not match.';
    return;
  }

  const exists = users.find(u => u.username === username);
  if (exists) {
    document.getElementById('signupError').innerText = 'Username already exists.';
    return;
  }

  users.push({ firstName, lastName, email, borrowerType, username, password });

  showMessage("Account created successfully!");
  showLogin('borrower');
}

function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  if (!username || !password) {
    document.getElementById('loginError').innerText = 'Please enter username and password.';
    return;
  }

  // ================= BORROWER LOGIN =================
  if (currentRole === 'borrower') {
    const validUser = users.find(
      u => u.username === username && u.password === password
    );

    if (!validUser) {
      document.getElementById('loginError').innerText = 'Invalid borrower credentials.';
      return;
    }

    currentUser = validUser;

    hideAll();
    document.getElementById('borrowerDashboard').classList.remove('hidden');
    fetchBooks();
  }

  // ================= LIBRARIAN LOGIN =================
  else if (currentRole === 'librarian') {

    if (username === "chiromolibrary" && password === "1234") {

      hideAll();
      document.getElementById('librarianDashboard').classList.remove('hidden');

    } else {
      document.getElementById('loginError').innerText = 'Invalid librarian credentials.';
      return;
    }
  }

  document.getElementById('loginError').innerText = '';
}

// ================= NAV =================
function hideAll() {
  document.getElementById('home').classList.add('hidden');
  document.getElementById('loginPage').classList.add('hidden');

  const signup = document.getElementById('signupPage');
  if (signup) signup.classList.add('hidden');

  document.getElementById('borrowerDashboard').classList.add('hidden');
  document.getElementById('librarianDashboard').classList.add('hidden');
}

function goHome() {
  hideAll();
  document.getElementById('home').classList.remove('hidden');
}

function logout() {
  currentUser = null;
  goHome();
}

// ================= BOOKS =================
function renderBooks(bookArray) {
  const list = document.getElementById('booksList');
  list.innerHTML = '';

  bookArray.forEach((book, index) => {
    const div = document.createElement('div');
    div.classList.add('card');

    div.innerHTML = `
      <strong>${book.title}</strong><br>
      Status: ${book.available ? 'Available' : 'Not Available'}<br>
      ${
        book.available
          ? `<button onclick="openBorrowModal(${index})">Borrow</button>`
          : `<button onclick="reserveBook(${book.id})">Reserve</button>`
      }
    `;

    list.appendChild(div);
  });
}

let selectedBookId = null;

function openBorrowModal(index, bookId) {
  selectedBookId = bookId;

  const book = currentBooks[index];

  document.getElementById('borrowBookTitle').innerText = book.title;
  document.getElementById('borrowModal').classList.remove('hidden');
}

function closeBorrowModal() {
  document.getElementById('borrowModal').classList.add('hidden');
}

// ================= BORROW + EMAIL =================
async function confirmBorrow() {
  const date = document.getElementById('borrowDate').value;

  if (!date) {
    showMessage("Select a date", "error");
    return;
  }

  try {
    // 1. call backend borrow procedure
    await fetch(`${API_BASE}/borrow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BorrowerID: "B001", // ⚠️ later replace with real logged-in user
        BookID: selectedBookId,
        DateOfIssue: date
      })
    });

    // 2. send email
    await fetch(`${API_BASE}/send-borrow-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: currentUser?.email,
        book: document.getElementById('borrowBookTitle').innerText,
        date: date
      })
    });

    showMessage("Borrow request submitted successfully");

    closeBorrowModal();
    fetchBooks(); // refresh list

  } catch {
    showMessage("Error processing borrow", "error");
  }
}

async function reserveBook(bookID) {
  try {
    const res = await fetch(`${API_BASE}/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BookID: bookID,
        BorrowerID: "B001", // replace with real user later
        Status: "Waiting",
        email: currentUser?.email
      })
    });

    const data = await res.json();

    if (res.ok) {
      showMessage("Reservation placed successfully");
    } else {
      showMessage(data.error || "Reservation failed", "error");
    }

  } catch {
    showMessage("Server error while reserving", "error");
  }
}

// ================= SEARCH =================
function searchBooks() {
  const query = document.getElementById('searchInput').value.toLowerCase();
  const filtered = currentBooks.filter(book => book.title.toLowerCase().includes(query));
  renderBooks(filtered);
}

// ================= LIBRARIAN =================
async function loadView(type) {
  try {
    const res = await fetch(`${API_BASE}/views/${type}`);
    const data = await res.json();

    const container = document.getElementById('viewData');

    if (!data.length) {
      container.innerHTML = "<p>No data available</p>";
      return;
    }

    let table = "<table border='1' style='width:100%; border-collapse:collapse;'>";
    
    // Table header
    table += "<tr>";
    Object.keys(data[0]).forEach(k => {
      table += `<th>${k}</th>`;
    });
    table += "</tr>";

    // Table rows
    data.forEach(row => {
      table += "<tr>";
      Object.values(row).forEach(v => {
        table += `<td>${v}</td>`;
      });
      table += "</tr>";
    });

    table += "</table>";

    container.innerHTML = table;

  } catch (err) {
    console.error(err);
    showMessage("Error loading data", "error");
  }
}

async function borrowBook() {
  try {
    const res = await fetch(`${API_BASE}/borrow`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BorrowerID: document.getElementById('borrowerID').value,
        BookID: document.getElementById('borrowBookID').value,
        DateOfIssue: document.getElementById('issueDate').value
      })
    });

    const data = await res.json();

    if (!res.ok) throw new Error(data.message || "Borrow failed");

    showMessage(data.message);

  } catch (err) {
    showMessage(err.message, "error");
  }
}

function showSection(section) {
  // hide all sections
  document.getElementById('booksSection').classList.add('hidden');
  document.getElementById('profileSection').classList.add('hidden');
  document.getElementById('historySection').classList.add('hidden');

  // show selected section
  document.getElementById(section + 'Section').classList.remove('hidden');

  //show books
  if(section==='books'){
    fetchBooks();
  }

  // load profile data
  if (section === 'profile' && currentUser) {
    document.getElementById('welcomeText').innerText =
      `Welcome, ${currentUser.firstName}!`;

    document.getElementById('profileName').innerText =
      currentUser.firstName + ' ' + currentUser.lastName;

    document.getElementById('profileEmail').innerText =
      currentUser.email;

    document.getElementById('profileType').innerText =
      currentUser.borrowerType;

    document.getElementById('profileUsername').innerText =
      currentUser.username;
  }

  // load history
  if (section === 'history') {
    renderHistory();
  }
}

function showLibrarianSection(section) {
  [
    'addBookSection',
    'addPublisherSection',
    'addCatalogueSection',
    'borrowSection',
    'returnSection',
    'reserveSection',
    'registerBorrowerSection',
    'viewsSection'
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.add('hidden');
  });

  document.getElementById(section + 'Section').classList.remove('hidden');
}

async function addBook() {
  try {
    const res = await fetch(`${API_BASE}/add-book`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BookID: document.getElementById('bookID').value,
        Book_Title: document.getElementById('bookTitle').value,
        BookType: document.getElementById('bookType').value,
        Author: document.getElementById('author').value,
        PublisherID: document.getElementById('publisherID').value,
        Supplier: document.getElementById('supplier').value,
        DateOfPurchase: document.getElementById('purchaseDate').value,
        NumberOfCopies: document.getElementById('copies').value,
        Price: document.getElementById('price').value
      })
    });

    const data = await res.json();

    if (res.ok) {
      showMessage(data.message);
    } else {
      showMessage(data.error || "Failed to add book", "error");
    }

  } catch (err) {
    showMessage("Server error while adding book", "error");
  }
}

async function addPublisher() {
  try {
    const res = await fetch(`${API_BASE}/add-publisher`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        PublisherID: pubID.value,
        PublisherName: pubName.value,
        Address: pubAddress.value,
        Email: pubEmail.value,
        PhoneNumber: pubPhone.value
      })
    });

    const data = await res.json();
    showMessage(data.message);
  } catch {
    showMessage("Error adding publisher", "error");
  }
}

async function addCatalogue() {
  try {
    const res = await fetch(`${API_BASE}/add-catalogue`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        CatalogueID: catID.value,
        PublisherID: catPublisherID.value,
        DateReceived: catDate.value,
        Description: catDesc.value
      })
    });

    const data = await res.json();
    showMessage(data.message);
  } catch {
    showMessage("Error adding catalogue", "error");
  }
}

async function makeReservation() {
  try {
    const res = await fetch(`${API_BASE}/reserve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BookID: resBookID.value,
        BorrowerID: resBorrowerID.value,
        Status: "Waiting"
      })
    });

    const data = await res.json();
    showMessage(data.message);
  } catch {
    showMessage("Error reserving", "error");
  }
}

async function registerBorrower() {
  try {
    const res = await fetch(`${API_BASE}/add-borrower`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        BorrowerID: bID.value,
        BorrowerName: bName.value,
        BorrowerType: bType.value,
        Email: bEmail.value,
        PhoneNumber: bPhone.value
      })
    });

    const data = await res.json();
    showMessage(data.message);
  } catch {
    showMessage("Error registering borrower", "error");
  }
}

function renderHistory() {
  const historyDiv = document.getElementById('history');

  if (!historyData.length) {
    historyDiv.innerHTML = "<p>No history</p>";
    return;
  }

  historyDiv.innerHTML = historyData.map(h =>
    `<div class="card">${h.book} - ${h.status}</div>`
  ).join('');
}