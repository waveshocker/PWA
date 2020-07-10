let db;
const request = indexedDB.open("Budget History", 1);

request.onupgradeneeded = function (event) {
  const db = event.target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

request.onsuccess = function (event) {
  db = event.target.result;

  // check if app is online before reading from db
  if (navigator.onLine) {
    checkDatabase();
  }
};

request.onerror = function (event) {
  console.log("error " + event.target.errorCode);
};

function saveRecord(record) {
  const entry = db.transaction(["pending"], "readwrite");
  const bank = entry.objectStore("pending");

  bank.add(record);
}

function checkDatabase() {
  const entry = db.transaction(["pending"], "readwrite");
  const bank = entry.objectStore("pending");
  const requestAll = bank.getAll();

  requestAll.onsuccess = function () {
    if (requestAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(requestAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json"
        }
      })
        .then(response => response.json())
        .then(() => {
          // delete records if successful
          const entry = db.transaction(["pending"], "readwrite");
          const bank = entry.objectStore("pending");
          bank.clear();
        });
    }
  };
}

function deletePending() {
  const entry = db.transaction(["pending"], "readwrite");
  const bank = entry.objectStore("pending");
  bank.clear();
}

// listen for app coming back online
window.addEventListener("online", checkDatabase);