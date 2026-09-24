function initializePrivateFileSharing() {
    const attachBtn = document.getElementById("attachBtn");
    const fileInput = document.getElementById("fileInput");
    if(!attachBtn || !fileInput) return;
    attachBtn.onclick = function (){
        fileInput.click();
    };
    fileInput.onchange = function () {
        const file = fileInput.files[0];
        if (!file) return;
        showPrivateFile(file);
        fileInput.value = "";
    };
}

function showPrivateFile(file){
    const box = document.getElementById("messages");
    if(!box) return;
    const div = document.createElement("div");
    div.className="message sent file-message";
    div.innerHTML=`
        <div class="file-info">
            <span class="file-icon">
                ${getFileIcon(file)}
            </span>
            <div>
                <b>${file.name}</b>
                <small>
                    ${formatFileSize(file.size)}
                </small>
            </div>
        </div>
    `;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
}

function initializeGroupFileSharing(){
    const attachBtn = document.getElementById("groupAttachBtn");
    const fileInput = document.getElementById("groupFileInput");
    if(!attachBtn || !fileInput) return;
    attachBtn.onclick = function(){
        fileInput.click();
    };
    fileInput.onchange = function(){
        const file = fileInput.files[0];
        if(!file) return;
        showGroupFile(file);
        fileInput.value = "";
    };
}

