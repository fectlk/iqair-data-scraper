const xlsxFilesList = document.getElementById("xlsx-files");
const allStationsMapFilesList = document.getElementById(
  "all-stations-map-files"
);
const weeklyAqiFilesList = document.getElementById("weekly-aqi-files");

const downloadBtn = document.getElementById("download-btn");
const loadingOverlay = document.getElementById("loading-overlay");

const repoOwner = "fectlk";
const repoName = "iqair-data-scraper";
const branchName = "main";

async function fetchFiles(folderPath) {
  const url = `https://api.github.com/repos/${repoOwner}/${repoName}/contents/${folderPath}?ref=${branchName}`;
  try {
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Error fetching files:", error);
    alert("Error fetching files. Check console for details.");
    hideLoading();
    return [];
  }
}

function showLoading() {
  loadingOverlay.style.visibility = "visible";
}

function hideLoading() {
  loadingOverlay.style.visibility = "hidden";
}

async function populateFileList() {
  try {
    showLoading();

    const [xlsxFiles, allStationsMapFiles, weeklyAqiFiles] =
      await Promise.all([
        fetchFiles("charts"),
        fetchFiles("all_stations_maps"),
        fetchFiles("weekly_charts"),
      ]);

    hideLoading();

    if (
      !xlsxFiles.length &&
      !allStationsMapFiles.length &&
      !weeklyAqiFiles.length
    ) {
      alert("No files found in the repository.");
      return;
    }

    function extractTimestamp(filename) {
      const match = filename.match(
        /\d{4}-\d{2}-\d{2}(?:[_-]\d{2}[_-]\d{2}[_-]\d{2})?/
      );
      if (!match) return new Date(0);

      const dateParts = match[0].split(/[_-]/);

      if (dateParts.length === 3) {
        return new Date(
          `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}T00:00:00Z`
        );
      } else {
        return new Date(
          `${dateParts[0]}-${dateParts[1]}-${dateParts[2]}T${dateParts[3]}:${dateParts[4]}:${dateParts[5]}Z`
        );
      }
    }

    function addFilesToList(files, listElement, folderName) {
      files.sort(
        (a, b) => extractTimestamp(b.name) - extractTimestamp(a.name)
      );

      files.forEach((file) => {
        const fileUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/${branchName}/${folderName}/${file.name}`;
        const listItem = document.createElement("li");
        const fileDisplayName = file.name.replace(/\.[^/.]+$/, ""); // removes the file extension
        listItem.innerHTML = `<input type="checkbox" value="${fileUrl}" id="${folderName}-${file.name}">
                <label for="${folderName}-${file.name}">${fileDisplayName}</label>`;

        listElement.appendChild(listItem);
      });
    }

    addFilesToList(xlsxFiles, xlsxFilesList, "charts");
    addFilesToList(
      allStationsMapFiles,
      allStationsMapFilesList,
      "all_stations_maps"
    );
    addFilesToList(weeklyAqiFiles, weeklyAqiFilesList, "weekly_charts");
  } catch (error) {
    console.error("Error populating file list:", error);
    hideLoading();
  }
}

async function forceDownload(fileUrl, fileName) {
  try {
    const response = await fetch(fileUrl);
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  } catch (error) {
    console.error("Download failed:", error);
  }
}

downloadBtn.addEventListener("click", () => {
  const checkboxes = document.querySelectorAll(
    'input[type="checkbox"]:checked'
  );
  if (checkboxes.length === 0) {
    alert("Please select at least one file to download.");
    return;
  }

  checkboxes.forEach((checkbox) => {
    const fileUrl = checkbox.value;
    const fileName = fileUrl.split("/").pop();
    forceDownload(fileUrl, fileName);
  });
});

const deselectBtn = document.getElementById("deselect-btn");

deselectBtn.addEventListener("click", () => {
  const checkboxes = document.querySelectorAll('input[type="checkbox"]');
  checkboxes.forEach((checkbox) => (checkbox.checked = false));
});

window.onload = populateFileList;