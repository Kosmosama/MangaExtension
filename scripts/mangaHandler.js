// Attach event listener for the form submission button in the manga addition/edition form
document.getElementById('chapterForm').addEventListener('submit', handleFormSubmission);

/**
 * Handles form submission to either add a new manga or update an existing one.
 * Processes any remaining bookmarks that have to be converted into mangas.
 * 
 * @param {Event} event - The form submission event. Prevents the default behavior and processes form data.
 * 
 * @throws {Error} Logs errors to the console if async operations fail.
 */
async function handleFormSubmission(event) {
    event.preventDefault();

    const form = document.getElementById('chapterForm');
    const isEditMode = !!form.dataset.editMode;
    const mangaTitle = form.dataset.mangaTitle;

    try {
        if (isEditMode && mangaTitle) {
            const manga = mangaList.find(m => m.title === mangaTitle);
            if (manga) {
                await updateMangaDetails(manga);
            } else {
                console.error('Manga not found for editing');
            }
        } else {
            await addNewManga();
            processRemainingBookmarks();
        }
    } catch (error) {
        console.error('An error occurred during form submission:', error);
    }
}

/**
 * Fills the manga form with the details of the manga to be edited.
 * 
 * @param {Object} manga - The manga object to be edited.
 */
function handleMangaEdition(manga) {
    fillMangaForm(manga);
    const form = document.getElementById('chapterForm');
    form.dataset.editMode = 'true';
    form.dataset.mangaTitle = manga.title;

    showMangaForm();
}

/**
 * Adds a new manga to the manga list.
 */
async function addNewManga() {
    const mangaData = await getMangaFormData();
    const validationError = validateMangaData(mangaData);

    if (validationError) {
        showModal(validationError);
        return;
    }

    const date = new Date().toLocaleString();
    const newManga = {
        ...mangaData,
        dayAdded: date,
        lastRead: date
    };

    mangaList.push(newManga);

    resetFormValues();
    hideMangaForm();
    refreshAndSaveMangas();
}

function hasChanges(manga, mangaData){
    return manga.image === mangaData.image &&
    manga.link === mangaData.link &&
    manga.readChapters === mangaData.readChapters &&
    manga.title === mangaData.title &&
    manga.favorite === mangaData.favorite;

}

/**
 * Updates the details of an existing manga.
 * 
 * @param {Object} manga - The manga object to be updated.
 */
async function updateMangaDetails(manga) {
    const mangaData = await getMangaFormData();
    const validationError = validateMangaData(mangaData, manga.title);

    if (validationError) {
        showModal(validationError);
        return;
    }
    if (hasChanges(manga, mangaData)) {
        handleLinkReload(manga);
        return;
    }
    Object.assign(manga, mangaData, { lastRead: new Date().toLocaleString() });

    resetFormValues();
    hideMangaForm();
    refreshAndSaveMangas();
}

/**
 * Fetches both the URL and the title of the current active tab.
 * 
 * @returns {Promise<Object>} A promise that resolves to an object containing the current tab's title and URL.
 */
async function getCurrentTabInfo() {
    return new Promise((resolve) => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tab) => {
            if (tab && tab.length > 0) {
                const tabInfo = {
                    title: tab[0].title || 'Error',
                    url: tab[0].url ? new URL(tab[0].url).href : 'Error'
                };
                resolve(tabInfo);
            } else {
                console.warn('No active tab found. Defaulting title and link to empty strings.');
                resolve({ title: '', url: '' });
            }
        });
    });
}

/**
 * Generates a unique title by appending a counter if the title is already used.
 *
 * @param {string} title - The original title.
 * 
 * @returns {string} A unique title that is not currently in use.
 */
function generateUniqueTitle(title) {
    if (!isNameUsed(title)) return title;

    let counter = 1;
    let newTitle = `${title} (${counter})`;

    // Increment the counter until a unique title is found
    while (isNameUsed(newTitle)) {
        counter++;
        newTitle = `${title} (${counter})`;
    }

    return newTitle;
}

/**
 * Retrieves the manga data from the form.
 *
 * @returns {Promise<Object>} A promise that resolves to an object containing the manga data from the form.
 */
async function getMangaFormData() {
    const linkInput = document.getElementById('link').value.trim();
    const titleInput = document.getElementById('title').value.trim();
    const readChaptersInput = document.getElementById('readChapters').value.trim();
    
    const { title: tabTitle, url: tabUrl } = await getCurrentTabInfo();
    
    const link = linkInput || tabUrl;
    const title = titleInput || generateUniqueTitle(tabTitle);

    const readChapters = parseInt(readChaptersInput, 10);
    const validReadChapters = isNaN(readChapters) || readChapters < 0 ? 0 : readChapters;

    return {
        image: document.getElementById('image').value.trim(),
        title: title,
        link: link,
        isImageWorking: true,
        readChapters: validReadChapters,
        favorite: document.getElementById('favorite').checked
    };
}

/**
 * Validates the manga data.
 * 
 * @param {Object} mangaData - The manga data to be validated.
 * @param {string} [originalTitle=''] - The original title of the manga (used for edit mode).
 * 
 * @returns {string|null} Validation error message or null if data is valid.
 */
function validateMangaData(mangaData, originalTitle = '') {
    if (!mangaData.title) {
        return 'modal-title-required';
    }
    if (mangaData.title !== originalTitle && isNameUsed(mangaData.title)) {
        return 'modal-unique-title-required';
    }
    return null;
}

/**
 * Fills the form with the data of the manga to be edited.
 * 
 * @param {Object} manga - The manga object to fill the form with.
 */
function fillMangaForm(manga) {
    document.getElementById('image').value = manga.image || '';
    document.getElementById('title').value = manga.title || '';
    document.getElementById('link').value = manga.link || '';
    document.getElementById('readChapters').value = manga.readChapters || 0;
    document.getElementById('favorite').checked = manga.favorite || false;
}

/**
 * Resets the form values to their default state.
 */
function resetFormValues() {
    const form = document.getElementById('chapterForm');
    form.reset();
    delete form.dataset.editMode;
    delete form.dataset.mangaTitle;
}

/**
 * Helper function to refresh the manga list and save the current state.
 */
function refreshAndSaveMangas() {
    loadFilteredMangas();
    saveMangas();
}

/**
 * Checks if a manga title is already used in the manga list.
 * 
 * @param {string} title - The manga title to check.
 * 
 * @returns {boolean} True if the title is already used, false otherwise.
 */
function isNameUsed(title) {
    return mangaList.some(manga => manga.title === title);
}

/**
 * Displays a modal with a given message.
 * 
 * @param {string} messageKey - The message key to translate and display in the modal.
 */
function showModal(messageKey) {
    const modal = document.getElementById('alertModal');
    modal.querySelector('.modal-body').textContent = translate(messageKey);
    modal.style.display = 'block';

    document.getElementById('closeModal').addEventListener('click', function () {
        modal.style.display = 'none';
    });
}

/**
 * Toggles the favorite status of a manga.
 * 
 * @param {Object} manga - The manga object to toggle favorite status for.
 */
function handleFavoriteToggle(manga, event) {
    manga.favorite = !manga.favorite;

    const fav = event.target;
    if (manga.favorite) {
        fav.classList.remove('fill-transparent');
        fav.classList.add('fill-yellow-400');
        fav.classList.add('hover:fill-light-red');
        fav.classList.remove('hover:fill-yellow-400');
    } else {
        fav.classList.remove('fill-yellow-400');
        fav.classList.add('fill-transparent'); 
        fav.classList.remove('hover:fill-light-red'); 
        fav.classList.add('hover:fill-yellow-400');
    }
    saveMangas();

}


/**
 * Updates the number of read chapters for a manga.
 * 
 * @param {Object} manga - The manga object to update.
 * @param {string} operation - The operation to perform ('+' to add, '-' to subtract).
 * @param {number} [amount=1] - The number of chapters to add or subtract.
 * 
 * @throws {Error} If the operation is not '+' or '-'.
 */
function handleChapterUpdate(manga, operation, amount = 1, event) {
    const mangaItemElement = event.target.closest('.manga-item');
    const mangaDateElement = mangaItemElement.querySelector('#date');
    const mangaChaptersElement = mangaItemElement.querySelector('#chapter-count');
    amount = parseInt(amount, 10) || 1;

    if (operation === "+") {
        if(manga.readChapters+amount > getMaxChapters()){
            handleMaxChapters(manga.readChapters+amount);
        }
        manga.readChapters = (parseInt(manga.readChapters, 10) || 0) + amount;
    } else if (operation === "-") {
        if (manga.readChapters <= 0) {
            manga.readChapters = 0;
        } else {
            manga.readChapters = (parseInt(manga.readChapters, 10) || 0) - amount;
        }
        
    } else {
        throw new Error("Invalid operation. Use '+' or '-'.");
    }

    manga.lastRead = new Date().toLocaleString();
    mangaDateElement.textContent = manga.lastRead;
    mangaChaptersElement.textContent = "Ch. " + manga.readChapters;
    saveMangas();
    if(document.getElementById('sortOption').value == 'chaptersRead'){
        loadFilteredMangas();
    }

}

async function handleLinkReload(manga) {
    const reloadDiv = document.getElementById('reloadLink');
    const newUrl = await getCurrentTabInfo();

    if(manga.link === newUrl.url){
        closeAllDialogs();
        return;
    }
    reloadDiv.style.display = 'flex';

    function closeDialog() {
        reloadDiv.style.display = 'none';
    }

    document.getElementById('cancelReloadCross').addEventListener('click', closeDialog, { once: true });
    document.getElementById('cancelReload').addEventListener('click', closeDialog, { once: true });

    document.getElementById('confirmReload').addEventListener('click', () => {
        if(manga.link === newUrl.url){
            return;
        }
        Object.assign(manga, {link: newUrl.url});
        saveMangas();
        closeDialog();
        closeAllDialogs();
    }, { once: true });
}

/**
 * Handles the deletion of a manga after a confirmation dialog.
 * 
 * @param {Object} manga - The manga object to delete.
 */
function handleMangaDeletion(manga, event) {
    const confirmDiv = document.getElementById('confirmationDialog');
    confirmDiv.style.display = 'flex';

    function closeDialog() {
        confirmDiv.style.display = 'none';
    }

    document.getElementById('cancelConfirmCross').addEventListener('click', closeDialog, { once: true });
    document.getElementById('cancelConfirm').addEventListener('click', closeDialog, { once: true });

    document.getElementById('confirm').addEventListener('click', () => {
        deleteManga(manga, event);
        closeDialog();
    }, { once: true });
}

/**
 * Deletes a manga from the manga list.
 * 
 * @param {Object} manga - The manga object to delete.
 */
function deleteManga(manga, event) {
    mangaList = mangaList.filter(m => m !== manga);
    
    const mangaItemElement = event.target.closest('.manga-item');
    mangaItemElement.parentElement.removeChild(mangaItemElement);

    saveMangas();
}
