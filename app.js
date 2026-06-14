// --- Category Configuration ---
const CATEGORIES = {
    income: [
        { id: "salary", name: "Maaş", color: "#10b981", icon: "briefcase" },
        { id: "freelance", name: "Freelance Çalışma", color: "#8b5cf6", icon: "laptop" },
        { id: "investment", name: "Yatırım Geliri", color: "#06b6d4", icon: "trending-up" },
        { id: "other", name: "Diğer Gelirler", color: "#6b7280", icon: "coins" }
    ],
    expense: [
        { id: "food", name: "Gıda & Market", color: "#f59e0b", icon: "shopping-bag" },
        { id: "rent", name: "Ev Kirası", color: "#3b82f6", icon: "home" },
        { id: "bills", name: "Faturalar", color: "#ef4444", icon: "file-text" },
        { id: "entertainment", name: "Eğlence & Sosyal", color: "#ec4899", icon: "activity" },
        { id: "transportation", name: "Ulaşım & Yakıt", color: "#10b981", icon: "navigation" },
        { id: "other", name: "Diğer Harcamalar", color: "#6b7280", icon: "credit-card" }
    ]
};

// --- App State ---
let transactions = [];
let monthlyLimit = 12000; // default budget limit

// --- DOM Elements ---
const totalBalanceEl = document.getElementById("total-balance");
const totalIncomeEl = document.getElementById("total-income");
const totalExpensesEl = document.getElementById("total-expenses");
const budgetProgressFill = document.getElementById("budget-progress-fill");
const budgetPercentageEl = document.getElementById("budget-percentage");
const budgetStatusText = document.getElementById("budget-status-text");
const limitTextEl = document.getElementById("limit-text");

const transactionForm = document.getElementById("transaction-form");
const txCategorySelect = document.getElementById("tx-category");
const transactionListEl = document.getElementById("transaction-list-element");

const searchInput = document.getElementById("search-input");
const filterTypeSelect = document.getElementById("filter-type-select");

const editLimitBtn = document.getElementById("edit-limit-btn");
const limitEditorPanel = document.getElementById("limit-editor-panel");
const limitInput = document.getElementById("limit-input");
const saveLimitBtn = document.getElementById("save-limit-btn");
const cancelLimitBtn = document.getElementById("cancel-limit-btn");

// --- Initialize App ---
document.addEventListener("DOMContentLoaded", () => {
    // Load data from localStorage
    loadState();

    // Set initial date picker to today
    document.getElementById("tx-date").value = new Date().toISOString().split('T')[0];

    // Populate initial categories dropdown based on default selected radio (income)
    updateCategoriesDropdown("income");

    // Event Bindings
    setupFormRadioListeners();
    setupLimitEditorListeners();
    
    // Form Submit
    transactionForm.addEventListener("submit", handleFormSubmit);

    // Search and Filters
    searchInput.addEventListener("input", renderTransactions);
    filterTypeSelect.addEventListener("change", renderTransactions);

    // Theme Toggle
    const themeToggleBtn = document.getElementById("theme-toggle");
    themeToggleBtn.addEventListener("click", () => {
        const isDark = document.body.classList.toggle("dark-mode");
        document.body.classList.toggle("light-mode", !isDark);
        themeToggleBtn.innerHTML = isDark ? `<i data-lucide="sun"></i>` : `<i data-lucide="moon"></i>`;
        lucide.createIcons();
    });

    // Populate mock data on first-time load
    initMockDataIfEmpty();

    // Core Render Call
    updateAll();
    lucide.createIcons();
});

// --- State Storage Helpers ---
function loadState() {
    const savedTx = localStorage.getItem("budget_transactions");
    if (savedTx) {
        transactions = JSON.parse(savedTx);
    }
    const savedLimit = localStorage.getItem("budget_limit");
    if (savedLimit) {
        monthlyLimit = parseFloat(savedLimit);
    }
    limitTextEl.innerText = `Limit: ₺${monthlyLimit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    limitInput.value = monthlyLimit;
}

function saveState() {
    localStorage.setItem("budget_transactions", JSON.stringify(transactions));
    localStorage.setItem("budget_limit", monthlyLimit);
}

// --- Mock Data Injection ---
function initMockDataIfEmpty() {
    if (transactions.length === 0) {
        const today = new Date();
        const formatDate = (daysAgo) => {
            const d = new Date();
            d.setDate(today.getDate() - daysAgo);
            return d.toISOString().split('T')[0];
        };

        transactions = [
            { id: "1", type: "income", description: "Maaş Ödemesi", amount: 18500, category: "salary", date: formatDate(5) },
            { id: "2", type: "expense", description: "Ev Kirası", amount: 4800, category: "rent", date: formatDate(4) },
            { id: "3", type: "expense", description: "Market Alışverişi", amount: 1245.50, category: "food", date: formatDate(3) },
            { id: "4", type: "income", description: "Logo Tasarımı Freelance", amount: 3200, category: "freelance", date: formatDate(2) },
            { id: "5", type: "expense", description: "Elektrik & İnternet Faturası", amount: 760, category: "bills", date: formatDate(2) },
            { id: "6", type: "expense", description: "Sinema ve Akşam Yemeği", amount: 530, category: "entertainment", date: formatDate(1) },
            { id: "7", type: "expense", description: "Metrobüs Kart Dolumu", amount: 200, category: "transportation", date: today.toISOString().split('T')[0] }
        ];
        saveState();
    }
}

// --- Form & Categories Management ---
function setupFormRadioListeners() {
    const radios = document.querySelectorAll('input[name="tx-type"]');
    radios.forEach(radio => {
        radio.addEventListener("change", (e) => {
            updateCategoriesDropdown(e.target.value);
        });
    });
}

function updateCategoriesDropdown(type) {
    txCategorySelect.innerHTML = "";
    CATEGORIES[type].forEach(cat => {
        const opt = document.createElement("option");
        opt.value = cat.id;
        opt.innerText = cat.name;
        txCategorySelect.appendChild(opt);
    });
}

// --- Limit Editor Toggle ---
function setupLimitEditorListeners() {
    editLimitBtn.addEventListener("click", () => {
        limitEditorPanel.style.display = "flex";
        limitInput.focus();
    });

    cancelLimitBtn.addEventListener("click", () => {
        limitEditorPanel.style.display = "none";
        limitInput.value = monthlyLimit;
    });

    saveLimitBtn.addEventListener("click", () => {
        const val = parseFloat(limitInput.value);
        if (isNaN(val) || val <= 0) {
            alert("Lütfen pozitif geçerli bir limit giriniz!");
            return;
        }

        monthlyLimit = val;
        saveState();
        updateAll();
        
        limitEditorPanel.style.display = "none";
    });
}

// --- Math & Computations ---
function handleFormSubmit(e) {
    e.preventDefault();

    const type = document.querySelector('input[name="tx-type"]:checked').value;
    const description = document.getElementById("tx-title").value.trim();
    const amount = parseFloat(document.getElementById("tx-amount").value);
    const category = txCategorySelect.value;
    const date = document.getElementById("tx-date").value;

    if (!description || isNaN(amount) || amount <= 0 || !category || !date) {
        alert("Lütfen tüm alanları doğru şekilde doldurun.");
        return;
    }

    const newTx = {
        id: Date.now().toString(),
        type,
        description,
        amount,
        category,
        date
    };

    transactions.unshift(newTx);
    saveState();
    updateAll();

    // Reset form fields
    document.getElementById("tx-title").value = "";
    document.getElementById("tx-amount").value = "";
    document.getElementById("tx-date").value = new Date().toISOString().split('T')[0];
}

function deleteTransaction(id) {
    transactions = transactions.filter(tx => tx.id !== id);
    saveState();
    updateAll();
}

// --- Render Layout Functions ---
function updateAll() {
    // 1. Recalculate metrics
    let incomeSum = 0;
    let expenseSum = 0;

    transactions.forEach(tx => {
        if (tx.type === "income") {
            incomeSum += tx.amount;
        } else {
            expenseSum += tx.amount;
        }
    });

    const balance = incomeSum - expenseSum;

    // 2. Render Widgets
    totalBalanceEl.innerText = `₺${balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    totalIncomeEl.innerText = `₺${incomeSum.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    totalExpensesEl.innerText = `₺${expenseSum.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;

    // Color balance card depending on surplus or deficit
    const balanceCard = document.querySelector(".balance-card");
    if (balance < 0) {
        balanceCard.style.borderColor = "var(--expense)";
    } else {
        balanceCard.style.borderColor = "var(--border-color)";
    }

    // 3. Render Limit Progress
    limitTextEl.innerText = `Limit: ₺${monthlyLimit.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
    const usagePercent = monthlyLimit > 0 ? (expenseSum / monthlyLimit) * 100 : 0;
    budgetPercentageEl.innerText = `${Math.round(usagePercent)}% Kullanıldı`;
    budgetProgressFill.style.width = `${Math.min(usagePercent, 100)}%`;

    // Limit warning coloring
    if (usagePercent >= 100) {
        budgetProgressFill.style.backgroundColor = "var(--expense)";
        budgetStatusText.innerText = "UYARI: Aylık bütçe limitiniz tamamen tükendi!";
        budgetStatusText.style.color = "var(--expense)";
    } else if (usagePercent >= 80) {
        budgetProgressFill.style.backgroundColor = "var(--warning)";
        budgetStatusText.innerText = "Dikkat: Bütçe limitinize oldukça yaklaştınız.";
        budgetStatusText.style.color = "var(--warning)";
    } else {
        budgetProgressFill.style.backgroundColor = "var(--income)";
        budgetStatusText.innerText = "Limit aşımı bulunmamaktadır.";
        budgetStatusText.style.color = "var(--text-secondary)";
    }

    // 4. Draw Charts
    renderCharts(expenseSum);

    // 5. Draw Lists
    renderTransactions();
}

function renderCharts(totalExpense) {
    const donutTotalVal = document.getElementById("donut-total-val");
    donutTotalVal.innerText = `₺${Math.round(totalExpense)}`;

    // Group expenses by category
    const expGroups = {};
    // Init categories to ensure legend is organized
    CATEGORIES.expense.forEach(c => {
        expGroups[c.id] = 0;
    });

    transactions.forEach(tx => {
        if (tx.type === "expense") {
            if (expGroups[tx.category] !== undefined) {
                expGroups[tx.category] += tx.amount;
            } else {
                expGroups[tx.category] = tx.amount;
            }
        }
    });

    const segmentsGroup = document.getElementById("donut-segments-group");
    const legendList = document.getElementById("chart-legend-list");
    segmentsGroup.innerHTML = "";
    legendList.innerHTML = "";

    if (totalExpense === 0) {
        // Render a grey placeholder circle if no expenses
        segmentsGroup.innerHTML = `
            <circle class="donut-segment" cx="21" cy="21" r="15.915" fill="transparent" 
                    stroke="rgba(255,255,255,0.05)" stroke-width="4.2" stroke-dasharray="100 0" stroke-dashoffset="25"></circle>
        `;
        legendList.innerHTML = `<span class="panel-desc">Görüntülenecek harcama verisi yok.</span>`;
        return;
    }

    let cumulativePercent = 0;

    // Sort categories by expenditure
    const sortedCats = CATEGORIES.expense
        .map(c => ({ ...c, total: expGroups[c.id] || 0 }))
        .filter(c => c.total > 0)
        .sort((a, b) => b.total - a.total);

    sortedCats.forEach(cat => {
        const percent = (cat.total / totalExpense) * 100;
        
        // Donut circle stroke dash offset mapping:
        // Radius of 15.915 gives a circumference of exactly 100
        // We start stroke-dashoffset at 25 (top) and accumulate backward
        const strokeDasharray = `${percent} ${100 - percent}`;
        const strokeDashoffset = 25 - cumulativePercent;

        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("class", "donut-segment");
        circle.setAttribute("cx", "21");
        circle.setAttribute("cy", "21");
        circle.setAttribute("r", "15.915");
        circle.setAttribute("fill", "transparent");
        circle.setAttribute("stroke", cat.color);
        circle.setAttribute("stroke-width", "4.2");
        circle.setAttribute("stroke-dasharray", strokeDasharray);
        circle.setAttribute("stroke-dashoffset", strokeDashoffset.toString());
        segmentsGroup.appendChild(circle);

        cumulativePercent += percent;

        // Add to legend
        const legendItem = document.createElement("div");
        legendItem.className = "legend-item";
        legendItem.innerHTML = `
            <span class="legend-color" style="background-color: ${cat.color};"></span>
            <span class="legend-name">${cat.name}</span>
            <span class="legend-value">₺${Math.round(cat.total)} (%${Math.round(percent)})</span>
        `;
        legendList.appendChild(legendItem);
    });
}

function renderTransactions() {
    const query = searchInput.value.toLowerCase().trim();
    const typeFilter = filterTypeSelect.value;

    transactionListEl.innerHTML = "";

    const filtered = transactions.filter(tx => {
        // Type search
        const matchesType = typeFilter === "all" || tx.type === typeFilter;
        // Text search
        const matchesQuery = tx.description.toLowerCase().includes(query) || 
                             getCategoryName(tx.type, tx.category).toLowerCase().includes(query) ||
                             tx.amount.toString().includes(query);
        return matchesType && matchesQuery;
    });

    if (filtered.length === 0) {
        transactionListEl.innerHTML = `
            <div class="panel-desc" style="text-align: center; padding: 40px 0;">
                <i data-lucide="info" style="margin: 0 auto 10px; display: block; width: 24px; height: 24px;"></i>
                Aradığınız kriterlere uygun işlem bulunamadı.
            </div>
        `;
        lucide.createIcons();
        return;
    }

    filtered.forEach(tx => {
        const item = document.createElement("li");
        item.className = "transaction-item";
        
        const catObj = getCategoryObj(tx.type, tx.category);
        const iconName = catObj ? catObj.icon : "credit-card";
        const catClass = `cat-${tx.category}s`; // dynamic class name
        const typeSymbol = tx.type === "income" ? "+" : "-";
        const typeClass = tx.type === "income" ? "tx-inc" : "tx-exp";

        const formattedAmount = `₺${tx.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}`;
        const formattedDate = new Date(tx.date).toLocaleDateString('tr-TR');

        item.innerHTML = `
            <div class="tx-main">
                <div class="tx-icon-wrapper ${catClass}">
                    <i data-lucide="${iconName}"></i>
                </div>
                <div class="tx-details">
                    <span class="tx-desc">${escapeHtml(tx.description)}</span>
                    <div class="tx-meta">
                        <span class="tx-cat">${catObj ? catObj.name : "Genel"}</span>
                        <span>•</span>
                        <span class="tx-date-label">${formattedDate}</span>
                    </div>
                </div>
            </div>
            <div class="tx-amount-area">
                <span class="tx-amt ${typeClass}">${typeSymbol}${formattedAmount}</span>
                <button class="tx-delete-btn" data-id="${tx.id}"><i data-lucide="trash-2"></i></button>
            </div>
        `;

        // Bind delete action
        const delBtn = item.querySelector(".tx-delete-btn");
        delBtn.addEventListener("click", () => deleteTransaction(tx.id));

        transactionListEl.appendChild(item);
    });

    lucide.createIcons();
}

// --- Helpers ---
function getCategoryObj(type, categoryId) {
    return CATEGORIES[type].find(c => c.id === categoryId);
}

function getCategoryName(type, categoryId) {
    const obj = getCategoryObj(type, categoryId);
    return obj ? obj.name : "Diğer";
}

function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}
