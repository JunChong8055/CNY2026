// Import Firebase Database Library
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-app.js";
import { getAuth, signInAnonymously } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-auth.js";
import { getFirestore, collection, addDoc, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/12.9.0/firebase-firestore.js";

// Firebase Database Configuration
const firebaseConfig = {
    apiKey: "AIzaSyABEPi1IZBPrwyXX7GpVA5wphEdZ9D2b28",
    authDomain: "jc8055cny2026.firebaseapp.com",
    projectId: "jc8055cny2026",
    storageBucket: "jc8055cny2026.firebasestorage.app",
    messagingSenderId: "431423230439",
    appId: "1:431423230439:web:3519a4aab211aa9b32ed42"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getFirestore(app);

// Elements Initialization
const txtNickname = document.getElementById("txtNickname");
const txtRoomId = document.getElementById("txtRoomId");
const errorRoomId = document.getElementById("errorRoomId");

// Variables Initialization
let userUID = null;
let userNickname = null;

// Textbox Value Nickname
const storedNickname = sessionStorage.getItem("JC8055CNY2026Nickname");
txtNickname.value = (storedNickname==null || storedNickname.trim()=="") ? "Guest" : storedNickname;
function StoreNickname(){
    const txtValueNickname = (txtNickname.value.trim()=="") ? "Guest" : txtNickname.value;
    sessionStorage.setItem("JC8055CNY2026Nickname", txtValueNickname);
    return txtValueNickname;
}

// Textbox Value Room ID
const roomId = new URLSearchParams(window.location.search).get("roomId");
if (roomId)
    txtRoomId.value = roomId;

// Create Anonymous Authentication
signInAnonymously(auth);

// Listen Authentication Get User Account
auth.onAuthStateChanged((user) => {
    userUID = user.uid;

    // Action Create Room Button
    document.getElementById("btnCreate").addEventListener("click", async () => {
        userNickname = StoreNickname();
        const docRef = await addDoc(collection(database, "room"), {
            win: 0,
            current_player: 1, 

            player_1_uid: userUID,
            player_1_nickname: userNickname,
            player_1_position: [0, 2],
            player_1_pop: [null, null],
            player_1_score: 0,

            player_2_uid: null,
            player_2_nickname: null,
            player_2_position: [4, 2],
            player_2_pop: [null, null],
            player_2_score: 0,
        });
        window.location.href = `game.html?roomId=${docRef.id}`;
    });

    // Action Join Room Button
    document.getElementById("btnJoin").addEventListener("click", async () => {
        const roomId = txtRoomId.value.trim();
        if (roomId=="")
            errorRoomId.textContent = "Please Enter A Room ID.";
        else
        {
            const roomRef = doc(database, "room", roomId);
            const roomSnap = await getDoc(roomRef);
            if (!roomSnap.exists())
                errorRoomId.textContent = "Invalid Room.";
            else
            {
                const roomData = roomSnap.data();
                if (!roomData.player_2_uid) 
                {
                    userNickname = StoreNickname();
                    await updateDoc(roomRef, {
                        player_2_uid: userUID,
                        player_2_nickname: userNickname
                    });
                }
                window.location.href = `game.html?roomId=${roomId}`;
            }
        }
    });
});