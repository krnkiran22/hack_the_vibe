import { createSlice } from "@reduxjs/toolkit";

const authslice = createSlice({
  name: "authslice",
  initialState: {
    playerdata: null,
    players: [],
    selectedTime: 60,
    selectedMode: "Free Style",
    playername: null,
    id: null,
    vediostate: false,
    address: "",
    soundEnabled: true,
    showMobileControls: false,
    maxStreak: 0,
  },
  reducers: {
    setPlayerData: (state, action) => {
      console.log("action", action);
      state.playerdata = action.payload;
      console.log("dispatched", state.playerdata);
    },
    setgameid: (state, action) => {
      state.id = action.payload;
    },
    setTimer: (state, action) => {
      console.log("action", action);
      state.selectedTime = action.payload;
    },
    setPlayers: (state, action) => {
      console.log("action", action);

      state.players = action.payload;
    },
    setPlayername: (state, action) => {
      state.playername = action.payload;
    },
    setVediostate: (state, action) => {
      state.vediostate = action.payload;
    },
    setAddress: (state, action) => {
      state.address = action.payload;
    },
    setMode: (state, action) => {
      state.selectedMode = action.payload;
    },
    setSoundEnabled: (state, action) => {
      state.soundEnabled = action.payload;
    },
    setShowMobileControls: (state, action) => {
      state.showMobileControls = action.payload;
    },
    setMaxStreak: (state, action) => {
      if (action.payload > state.maxStreak) {
        state.maxStreak = action.payload;
      }
    },
  },
});

export const {
  setTimer,
  setgameid,
  setPlayername,
  setPlayers,
  setPlayerData,
  setVediostate,
  setAddress,
  setMode,
  setSoundEnabled,
  setShowMobileControls,
  setMaxStreak,
} = authslice.actions;
export default authslice.reducer;
