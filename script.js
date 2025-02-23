var GoogleAuth;
const SCOPE = "https://www.googleapis.com/auth/drive.file";
const validAdminIds = JSON.parse(localStorage.getItem("adminIds")) || [
    "XDCQC@$$09**masteradmin**",
];

function handleClientLoad() {
    gapi.load("client:auth2", initClient);
}

function initClient() {
    gapi.client
        .init({
            apiKey: "YOUR_API_KEY",
            clientId: "YOUR_CLIENT_ID",
            discoveryDocs: [
                "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest",
            ],
            scope: SCOPE,
        })
        .then(() => {
            GoogleAuth = gapi.auth2.getAuthInstance();
            GoogleAuth.isSignedIn.listen(updateSigninStatus);
            updateSigninStatus(GoogleAuth.isSignedIn.get());
        });
}

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        loadNews(); // Memuat berita saat login berhasil
        loadAdmins(); // Memuat admin saat login berhasil
        loadPhotos(); // Memuat foto saat login berhasil
        deleteOldPhotos(); // Hapus foto yang sudah lebih dari 30 hari
    }
}

function handleAuthClick() {
    GoogleAuth.signIn();
}

function handleSignoutClick() {
    GoogleAuth.signOut();
}

function addNews() {
    const newsTitle = document.getElementById("newsTitle").value;
    const newsContent = document.getElementById("newsContent").value;
    const newsPhoto = document.getElementById("newsPhoto").files[0];
    const newsDate = new Date().toLocaleDateString();

    var fileMetadata = {
        name: newsPhoto.name,
        mimeType: newsPhoto.type,
    };
    var media = {
        mimeType: newsPhoto.type,
        body: newsPhoto,
    };
    gapi.client.drive.files
        .create({
            resource: fileMetadata,
            media: media,
            fields: "id",
        })
        .then(function(response) {
            var photoId = response.result.id;
            var photoUrl = "https://drive.google.com/uc?id=" + photoId;

            var newsList = JSON.parse(localStorage.getItem("newsList")) || [];
            newsList.push({
                title: newsTitle,
                content: newsContent,
                photoUrl: photoUrl,
                date: newsDate,
            });

            localStorage.setItem("newsList", JSON.stringify(newsList));
            displayNews();

            // Bersihkan form
            document.getElementById("newsTitle").value = "";
            document.getElementById("newsContent").value = "";
            document.getElementById("newsPhoto").value = "";
        });
}

function displayNews() {
    const newsList = JSON.parse(localStorage.getItem("newsList")) || [];
    const newsContainer1 = document.getElementById("newsContainer1");
    const newsContainer2 = document.getElementById("newsContainer2");
    const newsContainer3 = document.getElementById("newsContainer3");

    newsContainer1.innerHTML = "";
    newsContainer2.innerHTML = "";
    newsContainer3.innerHTML = "";

    let columnCounter = 0;

    newsList.forEach((news) => {
        const newsItem = document.createElement("div");
        newsItem.classList.add("news-item");
        newsItem.innerHTML = `
            <h3>${news.title}</h3>
            <p>${news.content}</p>
            <img src="${news.photoUrl}" alt="Foto Kegiatan" />
            <small>${news.date}</small>
        `;
        if (columnCounter % 3 === 0) {
            newsContainer1.appendChild(newsItem);
        } else if (columnCounter % 3 === 1) {
            newsContainer2.appendChild(newsItem);
        } else {
            newsContainer3.appendChild(newsItem);
        }
        columnCounter++;
    });
}

function addAdmin(event) {
    event.preventDefault();
    const newAdminId = document.getElementById("newAdminId").value;
    if (newAdminId) {
        var adminList = JSON.parse(localStorage.getItem("adminIds")) || [];
        adminList.push(newAdminId);
        localStorage.setItem("adminIds", JSON.stringify(adminList));
        alert(`ID Admin baru "${newAdminId}" berhasil ditambahkan!`);
        document.getElementById("newAdminId").value = "";
        loadAdmins(); // Memuat admin baru
    } else {
        alert("ID Admin tidak valid!");
    }
}

function loadAdmins() {
    const adminList = JSON.parse(localStorage.getItem("adminIds")) || [];
    adminList.forEach((adminId) => {
        if (!validAdminIds.includes(adminId)) {
            validAdminIds.push(adminId);
        }
    });
    localStorage.setItem("adminIds", JSON.stringify(validAdminIds));
}

function addPhoto(event) {
    event.preventDefault();
    const photoFile = document.getElementById("photoFile").files[0];
    var fileMetadata = {
        name: photoFile.name,
        mimeType: photoFile.type,
    };
    var media = {
        mimeType: photoFile.type,
        body: photoFile,
    };
    gapi.client.drive.files
        .create({
            resource: fileMetadata,
            media: media,
            fields: "id",
        })
        .then(function(response) {
            var photoId = response.result.id;
            var photoUrl = "https://drive.google.com/uc?id=" + photoId;

            var photoList = JSON.parse(localStorage.getItem("photoList")) || [];
            photoList.push({
                name: photoFile.name,
                url: photoUrl,
                timestamp: Date.now(),
            });

            localStorage.setItem("photoList", JSON.stringify(photoList));
            loadPhotos(); // Memuat foto baru
        });
}

function loadPhotos() {
    const photoList = JSON.parse(localStorage.getItem("photoList")) || [];
    const photosContainer = document.getElementById("photosContainer");
    photosContainer.innerHTML = ""; // Bersihkan konten kontainer foto

    photoList.forEach((photo) => {
        const photoElement = document.createElement("img");
        photoElement.src = photo.url;
        photoElement.alt = photo.name;
        photosContainer.appendChild(photoElement);
    });
}

function deleteOldPhotos() {
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const photoList = JSON.parse(localStorage.getItem("photoList")) || [];
    const newPhotoList = photoList.filter((photo) => {
        if (photo.timestamp <= thirtyDaysAgo) {
            // Hapus foto dari Google Drive
            var request = gapi.client.drive.files.delete({
                fileId: photo.url.split("id=")[1],
            });
            request.execute();
            return false;
        }
        return true;
    });
    localStorage.setItem("photoList", JSON.stringify(newPhotoList));
}

document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("newsContainer1")) {
        displayNews();
    }
    if (document.getElementById("photosContainer")) {
        loadPhotos();
    }
    if (document.getElementById("newAdminForm")) {
        loadAdmins();
    }
});