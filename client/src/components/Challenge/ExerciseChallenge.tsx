import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import NavBar from "../NavBar/NavBar";
import { httpService } from "../../httpService";
import AlertModal from "../AlertModal/AlertModal";
import "./ExerciseChallenge.scss";
import { UserDetails } from "../../App";

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

interface ExerciseChallengeProps {
  user: UserDetails | undefined;
}

const ExerciseChallenge: React.FC<ExerciseChallengeProps> = ({ user }) => {
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
  const [editedShareMessage, setEditedShareMessage] = useState<string>("");
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [currentActiveDay, setCurrentActiveDay] = useState<number>(1);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  const [showBadgeModal, setShowBadgeModal] = useState<boolean>(false);
  const [earnedBadge, setEarnedBadge] = useState<{ name: string; icon: string } | null>(null);

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
      const completedDays = parsed.filter((day: DayChallenge) => day.completed);
      let nextDay = 1;

      if (completedDays.length > 0) {
        const sortedDays = [...completedDays].sort((a, b) => a.day - b.day);
        const lastCompletedDay = sortedDays[sortedDays.length - 1];
        if (sortedDays.length === lastCompletedDay.day) {
          nextDay = lastCompletedDay.day + 1;
        } else {
          for (let i = 1; i <= sortedDays.length + 1; i++) {
            if (!parsed.some((day: DayChallenge) => day.day === i && day.completed)) {
              nextDay = i;
              break;
            }
          }
        }
      }
      setCurrentActiveDay(nextDay);
      setSelectedDay(nextDay <= 100 ? nextDay : 100);
      loadExerciseForDay(nextDay <= 100 ? nextDay : 100, parsed);
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
  const completeExercise = async () => {
    if (selectedDay !== null) {
      const dayIndex = challengeDays.findIndex(day => day.day === selectedDay);
      const wasEverCompleted = dayIndex < currentActiveDay - 1;

      if (selectedDay !== currentActiveDay && !wasEverCompleted) {
        setAlertMessage("You can only improve days that have already been completed, or complete the current active day.");
        setShowAlertModal(true);
        return;
      }

      const updatedDays = [...challengeDays];
      updatedDays[selectedDay - 1].completed = true;
      updatedDays[selectedDay - 1].date = new Date().toLocaleDateString();
      updatedDays[selectedDay - 1].timeSpent = timer;

      setChallengeDays(updatedDays);
      playSuccessSound();

      if (selectedDay === currentActiveDay) {
        setCurrentActiveDay(prev => Math.min(prev + 1, 100));
      }

      if (selectedDay === 100) {
        const allCompleted = updatedDays.every(day => day.completed);
        if (allCompleted) {
          setShowCompletionModal(true);
          const completionAudio = new Audio("/completion-sound.mp3");
          completionAudio.play().catch(error => console.log("Audio playback error:", error));
        }
      }

      if (isRunning) {
        if (timerInterval.current) {
          clearInterval(timerInterval.current);
          timerInterval.current = null;
        }
        setIsRunning(false);
      }

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

      const exercise = updatedDays[selectedDay - 1].exercise;
      const muscleGroup = determineMuscleGroup(exercise?.name || "");
      const emoji = getMuscleGroupEmoji(muscleGroup);

      setShareMessage(`${emoji} Day ${selectedDay}/100 Complete! ${emoji}\nI finished "${exercise?.name}" in ${formatTime(timer)}!\n#100DayFitnessChallenge`);

      if (isRunning) {
        toggleTimer();
      }

      const completedCount = updatedDays.filter(day => day.completed).length;
      await awardBadgeIfNeeded(completedCount);
    }
  };

  const BadgeModal = () => {
    if (!showBadgeModal || !earnedBadge) return null;

    return (
      <div className='modal-overlay'>
        <div className='modal-content'>
          <h2>Bravo</h2>
          <img src={earnedBadge.icon} alt={earnedBadge.name} className='badge-image' />
          <p>{earnedBadge.name}</p>
          <button onClick={() => setShowBadgeModal(false)} className='modal-button'>
            close
          </button>
        </div>
      </div>
    );
  };

  //Receiving Budget every 10 days
  const awardBadgeIfNeeded = async (completedDays: number) => {
    if (completedDays % 10 === 0) {
      const badgeLevel = completedDays / 10;
      const badge = {
        level: badgeLevel,
        name: `Elite ${badgeLevel * 10} Day`,
        icon: `/badges/badge-${badgeLevel}.png`,
        achievedAt: new Date().toISOString(),
      };

      try {
        await httpService.post("/user/badges", { badge });
        setEarnedBadge({ name: badge.name, icon: badge.icon });
        setShowBadgeModal(true);
      } catch (error) {
        console.error("Error awarding badge:", error);
      }

      const audio = new Audio("/success-badge.mp3");
      audio.play().catch(err => console.log("Audio playback error:", err));
    }
  };

  const selectDay = async (day: number) => {
    const isCompleted = challengeDays[day - 1].completed;
    const isCurrentActive = day === currentActiveDay;

    if (!isCompleted && !isCurrentActive) {
      setAlertMessage("You must complete the challenges in order. Complete the current day first.");
      setShowAlertModal(true);
      return;
    }
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
    // Check if the selected day is completed and prevent starting the timer
    if (selectedDay !== null && challengeDays[selectedDay - 1].completed && !isRunning) {
      return;
    }

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
    setEditedShareMessage(shareMessage);
    setShowShareModal(true);
  };

  const handleShareAsPost = async () => {
    try {
      // Create post using the existing API
      await httpService.post("/post", {
        body: editedShareMessage,
      });

      // Close modal and show success message
      setShowShareModal(false);
      setAlertMessage("Your achievement has been shared successfully!");
      setShowAlertModal(true);
    } catch (error) {
      console.error("Error sharing post:", error);
      setAlertMessage("Failed to share your achievement. Please try again.");
      setShowAlertModal(true);
    }
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

      // Reset the timer
      resetTimer();
      setShareMessage("");
      setShowDayResetModal(false);

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
    }
  };

  const ChallengeCompletionModal = () => {
    if (!showCompletionModal) return null;

    const totalTimeSpent = challengeDays.reduce((total, day) => total + (day.timeSpent || 0), 0);
    const formattedTotalTime = formatTime(totalTimeSpent);

    const shareFullChallenge = () => {
      const message = `🏆 I DID IT! 🏆\nI completed the 100-Day Fitness Challenge in ${formattedTotalTime} total workout time!\n#100DayFitnessChallenge #FitnessGoals`;
      setEditedShareMessage(message);
      setShowCompletionModal(false);
      setShowShareModal(true);
    };

    return (
      <div className='modal-overlay celebration'>
        <div className='modal-content completion-modal'>
          <div className='modal-header'>
            <div className='modal-icon'>🏆</div>
            <h2 className='modal-title'>CHALLENGE COMPLETED!</h2>
            <p className='modal-message'>Congratulations! You've completed all 100 days of the fitness challenge!</p>
          </div>

          <div className='completion-stats'>
            <div className='stat-item'>
              <div className='stat-value'>100</div>
              <div>Days Completed</div>
            </div>
            <div className='stat-item'>
              <div className='stat-value'>{formattedTotalTime}</div>
              <div>Total Workout Time</div>
            </div>
          </div>

          <div className='modal-actions'>
            <button onClick={() => setShowCompletionModal(false)} className='modal-button continue-button'>
              Continue
            </button>
            <button onClick={shareFullChallenge} className='modal-button share-button'>
              Share Achievement
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <>
        <NavBar user={user} />

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
      <BadgeModal />
      <NavBar user={user} />

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
          </div>
        </div>
        {/* Progress bar */}
        <div className='progress-bar'>
          <div
            className={`progress-fill 
                ${progress < 25 ? "progress-red" : progress < 50 ? "progress-orange" : progress < 75 ? "progress-yellow" : "progress-green"}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {/* Challenge Days Grid */}
        <div className='days-grid'>
          {challengeDays.map(day => (
            <div
              key={day.day}
              onClick={() => selectDay(day.day)}
              className={`day-item ${selectedDay === day.day ? "selected" : ""} 
                ${day.completed ? "completed" : ""} 
                ${day.day === currentActiveDay ? "active" : ""} 
                ${!day.completed && day.day !== currentActiveDay ? "locked" : ""}`}>
              <div className='day-number'>Day {day.day}</div>
              <div>{day.completed ? "✅" : day.day === currentActiveDay ? "🏋️" : "🔒"}</div>
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
                    <button onClick={toggleTimer} className={`timer-button ${isRunning ? "pause" : "start"}`} disabled={selectedDay !== null && challengeDays[selectedDay - 1].completed}>
                      {isRunning ? "Pause" : "Start"}
                    </button>
                    <button onClick={resetTimer} className='timer-button reset' disabled={selectedDay !== null && challengeDays[selectedDay - 1].completed}>
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
      <ChallengeCompletionModal />

      {/* Day Reset Modal */}
      <AlertModal show={showDayResetModal} message={`Are you sure you want to reset day ${selectedDay}? The day's progress will be deleted.`} onConfirm={resetDay} onCancel={() => setShowDayResetModal(false)} confirmText='Reset Day' cancelText='Cancel' />

      {/* Day Switching Modal */}
      <AlertModal show={showSwitchDayModal} message='Timer is running. Switch days anyway?' onConfirm={confirmDaySwitch} onCancel={cancelDaySwitch} confirmText='Switch' cancelText='Cancel' />

      {/* Share Modal */}
      <AlertModal show={showShareModal} message='Edit your achievement message:' onConfirm={handleShareAsPost} onCancel={() => setShowShareModal(false)} confirmText='Share as Post' cancelText='Cancel'>
        <textarea value={editedShareMessage} onChange={e => setEditedShareMessage(e.target.value)} className='share-message-textarea' rows={4} />
      </AlertModal>

      {/* General Alert Modal */}
      <AlertModal show={showAlertModal} message={alertMessage} onConfirm={() => setShowAlertModal(false)} onCancel={() => setShowAlertModal(false)} confirmText='Continue' cancelText='Cancel' />
    </>
  );
};

export default ExerciseChallenge;
