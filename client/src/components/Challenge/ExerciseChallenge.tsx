import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import NavBar from "../NavBar/NavBar";
import { httpService } from "../../httpService";
import AlertModal from "../AlertModal/AlertModal";
import "./ExerciseChallenge.scss";

interface Exercise {
  name: string;
  equipment: string;
  gifUrl: string;
  guidance?: string;
  completed?: boolean;
}

interface DayChallenge {
  day: number;
  exerciseId?: string;
  muscleGroup?: string;
  exercise?: Exercise | null;
  completed: boolean;
  date?: string;
  timeSpent?: number;
}

const ExerciseChallenge: React.FC = () => {
  const [challengeDays, setChallengeDays] = useState<DayChallenge[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [shareMessage, setShareMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [isLoadingExercise, setIsLoadingExercise] = useState<boolean>(false);
  const [showDayResetModal, setShowDayResetModal] = useState<boolean>(false);
  const [showAlertModal, setShowAlertModal] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>("");
  const [showSwitchDayModal, setShowSwitchDayModal] = useState<boolean>(false);
  const [pendingDaySelection, setPendingDaySelection] = useState<number | null>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const muscleGroups = ["back", "cardio", "chest", "lower arms", "lower legs", "neck", "shoulders", "upper arms", "upper legs", "waist"];

  useEffect(() => {
    initializeChallenge();
  }, []);

  const initializeChallenge = async () => {
    setIsLoading(true);

    // Get the current user ID from localStorage or the user object
    const token = localStorage.getItem("token");
    let userId = "";

    if (token) {
      try {
        // Decode the JWT to get the user ID
        const decoded = JSON.parse(atob(token.split(".")[1]));
        userId = decoded.id || "";
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }

    // Use user-specific storage key
    const storageKey = userId ? `exerciseChallenge_${userId}` : "exerciseChallenge_guest";
    const savedChallenge = localStorage.getItem(storageKey);

    if (savedChallenge) {
      const parsed = JSON.parse(savedChallenge);
      setChallengeDays(parsed);

      const today = new Date().toLocaleDateString();
      const todayCompletedDay = parsed.findIndex((day: DayChallenge) => day.date === today && day.completed);

      if (todayCompletedDay !== -1) {
        const selectedDayNumber = todayCompletedDay + 1;
        setSelectedDay(selectedDayNumber);
        loadExerciseForDay(selectedDayNumber, parsed);
      } else {
        const nextIncompleteDay = parsed.findIndex((day: DayChallenge) => !day.completed);
        if (nextIncompleteDay !== -1) {
          const selectedDayNumber = nextIncompleteDay + 1;
          setSelectedDay(selectedDayNumber);
          loadExerciseForDay(selectedDayNumber, parsed);
        }
      }
    } else {
      await createNewChallenge(storageKey);
    }

    setIsLoading(false);
  };

  // function for audio feedback
  const playSuccessSound = () => {
    const audio = new Audio("/success-sound.mp3");
    audio.play().catch(error => console.log("Audio playback error:", error));
  };

  const createNewChallenge = async (storageKey: string) => {
    try {
      const days: DayChallenge[] = Array.from({ length: 100 }, (_, i) => {
        const randomMuscleGroup = muscleGroups[Math.floor(Math.random() * muscleGroups.length)];
        return {
          day: i + 1,
          muscleGroup: randomMuscleGroup,
          exerciseId: `exercise_placeholder_${i}`,
          completed: false,
        };
      });

      setChallengeDays(days);
      localStorage.setItem(storageKey, JSON.stringify(days));
      setSelectedDay(1);
      await loadExerciseForDay(1, days);
    } catch (error) {
      console.error("Error creating challenge:", error);
    }
  };

  const loadExerciseForDay = async (day: number, currentDays: DayChallenge[] = challengeDays) => {
    const dayIndex = day - 1;
    if (currentDays[dayIndex]?.exercise?.name) {
      return;
    }
    setIsLoadingExercise(true);
    try {
      const muscleGroup = currentDays[dayIndex].muscleGroup || muscleGroups[Math.floor(Math.random() * muscleGroups.length)];
      const response = await axios.get<Exercise[]>(`http://localhost:3001/api/exercises/${muscleGroup}`);
      const randomIndex = Math.floor(Math.random() * response.data.length);
      const exercise = response.data[randomIndex];
      const updatedDays = [...currentDays];
      updatedDays[dayIndex] = {
        ...updatedDays[dayIndex],
        exercise,
        exerciseId: exercise.name,
        muscleGroup,
      };

      setChallengeDays(updatedDays);

      // Get the current user ID from localStorage or the user object
      const token = localStorage.getItem("token");
      let userId = "";

      if (token) {
        try {
          // Decode the JWT to get the user ID
          const decoded = JSON.parse(atob(token.split(".")[1]));
          userId = decoded.id || "";
        } catch (error) {
          console.error("Error decoding token:", error);
        }
      }

      // Use user-specific storage key
      const storageKey = userId ? `exerciseChallenge_${userId}` : "exerciseChallenge_guest";
      localStorage.setItem(storageKey, JSON.stringify(updatedDays));
    } catch (error) {
      console.error(`Error loading exercise for day ${day}:`, error);
    } finally {
      setIsLoadingExercise(false);
    }
  };

  // Mark a day's exercise as completed
  const completeExercise = () => {
    if (selectedDay !== null) {
      const updatedDays = [...challengeDays];
      updatedDays[selectedDay - 1].completed = true;
      updatedDays[selectedDay - 1].date = new Date().toLocaleDateString();
      updatedDays[selectedDay - 1].timeSpent = timer;

      setChallengeDays(updatedDays);
      playSuccessSound();

      // Get the current user ID from localStorage
      const token = localStorage.getItem("token");
      let userId = "";

      if (token) {
        try {
          // Decode the JWT to get the user ID
          const decoded = JSON.parse(atob(token.split(".")[1]));
          userId = decoded.id || "";
        } catch (error) {
          console.error("Error decoding token:", error);
        }
      }

      // Use user-specific storage key
      const storageKey = userId ? `exerciseChallenge_${userId}` : "exerciseChallenge_guest";
      localStorage.setItem(storageKey, JSON.stringify(updatedDays));

      // Prepare share message with emoji based on muscle group
      const exercise = updatedDays[selectedDay - 1].exercise;
      const muscleGroup = determineMuscleGroup(exercise?.name || "");
      const emoji = getMuscleGroupEmoji(muscleGroup);

      setShareMessage(`${emoji} Day ${selectedDay}/100 Complete! ${emoji}\nI finished "${exercise?.name}" in ${formatTime(timer)}!\n#100DayFitnessChallenge`);

      // Stop timer if it's running
      if (isRunning) {
        toggleTimer();
      }
    }
  };

  const selectDay = async (day: number) => {
    // If timer is running for current day, show confirmation modal
    if (isRunning && selectedDay !== null) {
      setPendingDaySelection(day);
      setShowSwitchDayModal(true);
      return;
    }

    // Otherwise proceed with day selection directly
    completeSelectDay(day);
  };

  // This function handles the actual day selection after confirmation
  const completeSelectDay = async (day: number) => {
    setSelectedDay(day);
    resetTimer();
    setShareMessage("");
    // Load the exercise for the selected day if needed
    await loadExerciseForDay(day);
  };

  // Handler for confirmation from modal
  const confirmDaySwitch = () => {
    if (pendingDaySelection !== null) {
      resetTimer();
      completeSelectDay(pendingDaySelection);
      setPendingDaySelection(null);
    }
    setShowSwitchDayModal(false);
  };

  // Handler for cancellation from modal
  const cancelDaySwitch = () => {
    setPendingDaySelection(null);
    setShowSwitchDayModal(false);
  };

  // Calculate and update progress whenever challengeDays changes
  useEffect(() => {
    const completedCount = challengeDays.filter(day => day.completed).length;
    setProgress(Math.floor((completedCount / 100) * 100));
  }, [challengeDays]);

  // Clean up interval on component unmount
  useEffect(() => {
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
    };
  }, []);

  // Start or pause the timer
  const toggleTimer = () => {
    if (isRunning) {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
    } else {
      timerInterval.current = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }

    setIsRunning(!isRunning);
  };

  // Reset the timer
  const resetTimer = () => {
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }

    setIsRunning(false);
    setTimer(0);
  };

  // Format timer display
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Helper function to determine muscle group from exercise name
  const determineMuscleGroup = (exerciseName: string): string => {
    const name = exerciseName.toLowerCase();

    if (name.includes("chest") || name.includes("bench") || name.includes("push")) return "chest";
    if (name.includes("back") || name.includes("row") || name.includes("pull")) return "back";
    if (name.includes("leg") || name.includes("squat") || name.includes("lunge")) return "legs";
    if (name.includes("shoulder") || name.includes("press") || name.includes("delt")) return "shoulders";
    if (name.includes("arm") || name.includes("bicep") || name.includes("tricep")) return "arms";
    if (name.includes("core") || name.includes("abs") || name.includes("crunch")) return "abs";
    if (name.includes("cardio") || name.includes("run") || name.includes("jump")) return "cardio";

    return "fitness";
  };

  // Get emoji for muscle group
  const getMuscleGroupEmoji = (muscleGroup: string): string => {
    switch (muscleGroup) {
      case "chest":
        return "💪";
      case "back":
        return "🔙";
      case "legs":
        return "🦵";
      case "shoulders":
        return "🏋️";
      case "arms":
        return "💪";
      case "abs":
        return "🔥";
      case "cardio":
        return "🏃";
      default:
        return "🏆";
    }
  };

  // Share completion on social media
  const shareCompletion = () => {
    // In a real app, this would connect to social media APIs
    // For now, we'll use the Web Share API if available
    if (navigator.share) {
      navigator
        .share({
          title: "100 Day Fitness Challenge",
          text: shareMessage,
        })
        .then(() => console.log("Shared successfully"))
        .catch(error => console.log("Error sharing:", error));
    } else {
      // Fallback for browsers that don't support the Web Share API
      navigator.clipboard
        .writeText(shareMessage)
        .then(() => alert("Share text copied to clipboard!\n\n" + shareMessage))
        .catch(err => alert("Failed to copy: " + err));
    }

    // Keep the share message available
  };

  // Formatter function
  function formatResponse(response: string): string {
    return response.replace(/\n/g, "<br />");
  }

  // Show the reset confirmation modal
  const openResetModal = () => {
    setShowResetModal(true);
  };

  // Close the reset confirmation modal
  const closeResetModal = () => {
    setShowResetModal(false);
  };

  // Reset challenge when confirmed in the modal
  const confirmReset = () => {
    // Get the current user ID from localStorage
    const token = localStorage.getItem("token");
    let userId = "";

    if (token) {
      try {
        // Decode the JWT to get the user ID
        const decoded = JSON.parse(atob(token.split(".")[1]));
        userId = decoded.id || "";
      } catch (error) {
        console.error("Error decoding token:", error);
      }
    }

    // Use user-specific storage key
    const storageKey = userId ? `exerciseChallenge_${userId}` : "exerciseChallenge_guest";
    localStorage.removeItem(storageKey);

    // Create a new challenge for this user
    createNewChallenge(storageKey);
    resetTimer();
    setShareMessage("");
    setShowResetModal(false);
  };

  // Get guidance for the selected exercise
  const handleGuidanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedDay === null) return;

    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const prompt = formData.get("prompt") as string;
    const exerciseName = challengeDays[selectedDay - 1].exercise?.name;

    if (!exerciseName) return;

    try {
      const response = await httpService.post<{ response: string }>("http://localhost:3001/api/exercises/guidance", { exercise: exerciseName, prompt });

      const updatedDays = [...challengeDays];
      if (updatedDays[selectedDay - 1].exercise) {
        updatedDays[selectedDay - 1].exercise!.guidance = formatResponse(response.data.response);
      }

      setChallengeDays(updatedDays);
      localStorage.setItem("exerciseChallenge", JSON.stringify(updatedDays));

      // Clear the input field
      form.reset();
    } catch (error) {
      console.error("Error getting guidance:", error);
    }
  };

  // Calculate streak (consecutive days completed)
  const calculateStreak = (): number => {
    let streak = 0;
    const sortedDays = [...challengeDays].filter(day => day.completed && day.date).sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime());

    if (sortedDays.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let lastDate = today;

    for (const day of sortedDays) {
      const dayDate = new Date(day.date!);
      dayDate.setHours(0, 0, 0, 0);

      const diffDays = Math.floor((lastDate.getTime() - dayDate.getTime()) / (1000 * 3600 * 24));

      if (diffDays <= 1) {
        streak++;
        lastDate = dayDate;
      } else {
        break;
      }
    }

    return streak;
  };

  // Reset Confirmation Modal Component
  const ResetConfirmationModal = () => {
    if (!showResetModal) return null;

    return (
      <div className='modal-overlay'>
        <div className='modal-content'>
          <div className='modal-header'>
            <div className='modal-icon'>⚠️</div>
            <h2 className='modal-title'>Reset Challenge?</h2>
            <p className='modal-message'>Are you sure you want to reset your 100-day challenge? All progress will be lost.</p>
          </div>

          <div className='modal-actions'>
            <button onClick={closeResetModal} className='modal-button cancel-button'>
              Cancel
            </button>
            <button onClick={confirmReset} className='modal-button confirm-button'>
              Reset Challenge
            </button>
          </div>
        </div>
      </div>
    );
  };

  const resetDay = () => {
    if (selectedDay !== null) {
      const updatedDays = [...challengeDays];
      updatedDays[selectedDay - 1].completed = false;
      updatedDays[selectedDay - 1].date = undefined;
      updatedDays[selectedDay - 1].timeSpent = 0;

      setChallengeDays(updatedDays);

      const token = localStorage.getItem("token");
      let userId = "";

      if (token) {
        try {
          const decoded = JSON.parse(atob(token.split(".")[1]));
          userId = decoded.id || "";
        } catch (error) {
          console.error("Error decoding token:", error);
        }
      }

      const storageKey = userId ? `exerciseChallenge_${userId}` : "exerciseChallenge_guest";
      localStorage.setItem(storageKey, JSON.stringify(updatedDays));

      resetTimer();
      setShareMessage("");
      setShowDayResetModal(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <NavBar />
        <div className='loading-container'>
          <div>
            <h2>Loading your 100-day challenge...</h2>
            <p>Preparing your personalized workout plan</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <NavBar />

      <div className='challenge-container'>
        <div className='challenge-header'>
          <h1>100-Day Fitness Challenge</h1>
          <button onClick={openResetModal} className='reset-button'>
            Reset Challenge
          </button>
        </div>
        {/* Challenge Progress Stats */}
        <div className='challenge-stats'>
          <div className='stats-container'>
            <div className='stat-item'>
              <div className='stat-value'>{challengeDays.filter(day => day.completed).length}</div>
              <div>Days Completed</div>
            </div>
            <div className='stat-item'>
              <div className='stat-value'>{100 - challengeDays.filter(day => day.completed).length}</div>
              <div>Days Remaining</div>
            </div>
            <div className='stat-item'>
              <div className='stat-value'>{progress}%</div>
              <div>Complete</div>
            </div>
            <div className='stat-item'>
              <div className='stat-value'>{calculateStreak()}</div>
              <div>Day Streak</div>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        {/* Progress bar with class-based styling */}
        <div className='progress-bar'>
          <div
            className={`progress-fill 
                ${progress < 25 ? "progress-red" : progress < 50 ? "progress-orange" : progress < 75 ? "progress-yellow" : "progress-green"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Challenge Days Grid */}
        <div className='days-grid'>
          {challengeDays.slice(0, 25).map(day => (
            <div key={day.day} onClick={() => selectDay(day.day)} className={`day-item ${selectedDay === day.day ? "selected" : ""} ${day.completed ? "completed" : ""}`}>
              <div className='day-number'>Day {day.day}</div>
              <div>{day.completed ? "✅" : "🏋️"}</div>
            </div>
          ))}
        </div>
        {/* Showing more days in a scrollable container */}
        <div className='days-grid'>
          {challengeDays.slice(25, 100).map(day => (
            <div key={day.day} onClick={() => selectDay(day.day)} className={`day-item ${selectedDay === day.day ? "selected" : ""} ${day.completed ? "completed" : ""}`}>
              <div className='day-number'>Day {day.day}</div>
              <div>{day.completed ? "✅" : "🏋️"}</div>
            </div>
          ))}
        </div>
        {/* Selected Day Exercise Section */}
        {isLoadingExercise ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <p>Loading exercise details...</p>
          </div>
        ) : (
          <div>
            <h3 className='exercise-title'>{selectedDay !== null ? challengeDays[selectedDay - 1].exercise?.name ?? "No exercise assigned" : "No exercise assigned"}</h3>

            <p className='equipment-tag'>Equipment: {selectedDay !== null ? challengeDays[selectedDay - 1].exercise?.equipment || "None required" : "None required"}</p>

            {/* Two column layout for larger screens */}
            <div className='exercise-content'>
              {/* Left column - Image */}
              <div className='exercise-image'>
                {selectedDay !== null && challengeDays[selectedDay - 1]?.exercise?.gifUrl && (
                  <div className='image-container'>
                    <img src={challengeDays[selectedDay - 1].exercise?.gifUrl} alt={challengeDays[selectedDay - 1].exercise?.name} />
                  </div>
                )}
              </div>

              {/* Right column - Timer and controls */}
              <div className='exercise-controls'>
                <div className='timer-container'>
                  <div className='timer-display'>{formatTime(timer)}</div>

                  <div className='timer-buttons'>
                    <button onClick={toggleTimer} className={`timer-button ${isRunning ? "pause" : "start"}`}>
                      {isRunning ? "Pause" : "Start"}
                    </button>

                    <button onClick={resetTimer} className='timer-button reset'>
                      Reset
                    </button>
                  </div>
                </div>
                {selectedDay !== null && !challengeDays[selectedDay - 1].completed && (
                  <button onClick={completeExercise} className='complete-button'>
                    Complete Exercise
                  </button>
                )}
                {selectedDay !== null && challengeDays[selectedDay - 1].completed && (
                  <>
                    <div className='completion-info'>
                      <p className='completion-status'>✅ Completed in {formatTime(challengeDays[selectedDay - 1].timeSpent || 0)}</p>
                      <p className='completion-date'>Completed on: {challengeDays[selectedDay - 1].date || "Unknown date"}</p>
                    </div>
                    <button onClick={() => setShowDayResetModal(true)} className='reset-day-button'>
                      Reset This Day
                    </button>
                  </>
                )}
                {/* OpenAI Guidance Section */}
                <div className='guidance-section'>
                  <h3 className='guidance-title'>Get Exercise Guidance</h3>

                  <form onSubmit={handleGuidanceSubmit} className='guidance-form'>
                    <input type='text' placeholder={`Ask anything about ${selectedDay !== null ? challengeDays[selectedDay - 1].exercise?.name : ""}...`} name='prompt' className='guidance-input' />
                    <button className='guidance-button'>Get Guidance</button>
                  </form>

                  {selectedDay !== null && challengeDays[selectedDay - 1].exercise?.guidance && <div className='guidance-result' dangerouslySetInnerHTML={{ __html: challengeDays[selectedDay - 1].exercise?.guidance ?? "" }} />}
                </div>
                {/* Share Completion Section */}
                {selectedDay !== null && challengeDays[selectedDay - 1].completed && (
                  <div className='share-section'>
                    <h2>Share Your Achievement</h2>
                    <p>{shareMessage}</p>
                    <button onClick={shareCompletion} className='share-button'>
                      <span>Share on Social Media</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Render the modal */}
      <ResetConfirmationModal />

      {/* Day Reset Modal */}
      <AlertModal show={showDayResetModal} message={`Are you sure you want to reset day ${selectedDay}? The day's progress will be deleted.`} onConfirm={resetDay} onCancel={() => setShowDayResetModal(false)} confirmText='Reset Day' cancelText='Cancel' />

      {/* Day Switching Modal */}
      <AlertModal show={showSwitchDayModal} message='Timer is running. Switch days anyway?' onConfirm={confirmDaySwitch} onCancel={cancelDaySwitch} confirmText='Switch' cancelText='Cancel' />
      {/* General Alert Modal */}
      <AlertModal show={showAlertModal} message={alertMessage} onConfirm={() => setShowAlertModal(false)} onCancel={() => setShowAlertModal(false)} confirmText='Continue' cancelText='Cancel' />
    </>
  );
};

export default ExerciseChallenge;
