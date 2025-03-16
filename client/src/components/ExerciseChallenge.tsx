import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import NavBar from "./NavBar/NavBar";
import { httpService } from "../httpService";

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
  const [allExercises, setAllExercises] = useState<Exercise[]>([]);
  const [challengeDays, setChallengeDays] = useState<DayChallenge[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [timer, setTimer] = useState<number>(0);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [shareMessage, setShareMessage] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [showResetModal, setShowResetModal] = useState<boolean>(false);
  const [isLoadingExercise, setIsLoadingExercise] = useState<boolean>(false);

  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const muscleGroups = ["back", "cardio", "chest", "lower arms", "lower legs", "neck", "shoulders", "upper arms", "upper legs", "waist"];

  useEffect(() => {
    initializeChallenge();
  }, []);

  const initializeChallenge = async () => {
    setIsLoading(true);

    const savedChallenge = localStorage.getItem("exerciseChallenge");

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
      await createNewChallenge();
    }

    setIsLoading(false);
  };

  const createNewChallenge = async () => {
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
      localStorage.setItem("exerciseChallenge", JSON.stringify(days));
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
      localStorage.setItem("exerciseChallenge", JSON.stringify(updatedDays));
    } catch (error) {
      console.error(`Error loading exercise for day ${day}:`, error);
    } finally {
      setIsLoadingExercise(false);
    }
  };

  const selectDay = async (day: number) => {
    // If timer is running for current day, confirm before switching
    if (isRunning && selectedDay !== null) {
      if (!window.confirm("Timer is running. Switch days anyway?")) {
        return;
      }
      resetTimer();
    }
    setSelectedDay(day);
    resetTimer();
    setShareMessage("");
    // Load the exercise for the selected day if needed
    await loadExerciseForDay(day);
  };

  // Calculate and update progress whenever challengeDays changes
  useEffect(() => {
    const completedCount = challengeDays.filter(day => day.completed).length;
    setProgress(Math.floor((completedCount / 100) * 100));
  }, [challengeDays]);

  // Initialize 100-day challenge
  const initializeChallengeDays = (exercises: Exercise[]) => {
    // Load saved challenge data from localStorage if available
    const savedChallenge = localStorage.getItem("exerciseChallenge");

    if (savedChallenge) {
      const parsed = JSON.parse(savedChallenge);
      setChallengeDays(parsed);

      // If there's a day that was completed today, select it automatically
      const today = new Date().toLocaleDateString();
      const todayCompletedDay = parsed.findIndex((day: DayChallenge) => day.date === today && day.completed);

      if (todayCompletedDay !== -1) {
        setSelectedDay(todayCompletedDay + 1);
      } else {
        // Find the first incomplete day
        const nextIncompleteDay = parsed.findIndex((day: DayChallenge) => !day.completed);
        if (nextIncompleteDay !== -1) {
          setSelectedDay(nextIncompleteDay + 1);
        }
      }
    } else {
      // Create new challenge with randomly assigned exercises
      const shuffledExercises = [...exercises].sort(() => Math.random() - 0.5);
      const days: DayChallenge[] = Array.from({ length: 100 }, (_, i) => ({
        day: i + 1,
        exercise: shuffledExercises[i % shuffledExercises.length] || null,
        completed: false,
      }));

      setChallengeDays(days);
      localStorage.setItem("exerciseChallenge", JSON.stringify(days));

      // Auto-select day 1
      setSelectedDay(1);
    }
  };

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

  // Mark a day's exercise as completed
  const completeExercise = () => {
    if (selectedDay !== null) {
      const updatedDays = [...challengeDays];
      updatedDays[selectedDay - 1].completed = true;
      updatedDays[selectedDay - 1].date = new Date().toLocaleDateString();
      updatedDays[selectedDay - 1].timeSpent = timer;

      setChallengeDays(updatedDays);
      localStorage.setItem("exerciseChallenge", JSON.stringify(updatedDays));

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
    localStorage.removeItem("exerciseChallenge");
    initializeChallengeDays(allExercises);
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
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 1000,
        }}>
        <div
          style={{
            backgroundColor: "white",
            borderRadius: "8px",
            padding: "24px",
            width: "90%",
            maxWidth: "450px",
            boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
            animation: "fadeInScale 0.3s ease-out",
          }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <div style={{ fontSize: "28px", color: "#f44336", marginBottom: "8px" }}>⚠️</div>
            <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "4px" }}>Reset Challenge?</h2>
            <p style={{ fontSize: "1rem", color: "#555", marginTop: "10px" }}>Are you sure you want to reset your 100-day challenge? All progress will be lost.</p>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "24px" }}>
            <button
              onClick={closeResetModal}
              style={{
                padding: "10px 20px",
                backgroundColor: "#e0e0e0",
                color: "#333",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "500",
              }}>
              Cancel
            </button>
            <button
              onClick={confirmReset}
              style={{
                padding: "10px 20px",
                backgroundColor: "#f44336",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "1rem",
                fontWeight: "500",
              }}>
              Reset Challenge
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <>
        <NavBar />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "70vh" }}>
          <div style={{ textAlign: "center" }}>
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

      <div className='challenge-container' style={{ margin: "2rem", fontFamily: "Arial, sans-serif" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}>
          <h1 style={{ margin: 0 }}>100-Day Fitness Challenge</h1>
          <button
            onClick={openResetModal}
            style={{
              padding: "8px 16px",
              backgroundColor: "#f44336",
              color: "white",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "0.8rem",
            }}>
            Reset Challenge
          </button>
        </div>
        {/* Challenge Progress Stats */}
        <div
          style={{
            padding: "15px",
            backgroundColor: "#e8f5e9",
            borderRadius: "10px",
            marginBottom: "2rem",
          }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-around",
              flexWrap: "wrap",
              gap: "10px",
            }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{challengeDays.filter(day => day.completed).length}</div>
              <div>Days Completed</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{100 - challengeDays.filter(day => day.completed).length}</div>
              <div>Days Remaining</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{progress}%</div>
              <div>Complete</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", fontWeight: "bold" }}>{calculateStreak()}</div>
              <div>Day Streak</div>
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div
          style={{
            height: "12px",
            backgroundColor: "#e0e0e0",
            borderRadius: "6px",
            margin: "15px 0",
            overflow: "hidden",
          }}>
          <div
            style={{
              height: "100%",
              width: `${Math.floor((challengeDays.filter(day => day.completed).length / 100) * 100)}%`,
              backgroundColor: "#4caf50",
              borderRadius: "6px",
            }}
          />
        </div>
        {/* Challenge Days Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))",
            gap: "10px",
            marginBottom: "2rem",
          }}>
          {challengeDays.slice(0, 25).map(day => (
            <div
              key={day.day}
              onClick={() => selectDay(day.day)}
              style={{
                padding: "10px",
                textAlign: "center",
                backgroundColor: selectedDay === day.day ? "#bbdefb" : day.completed ? "#c8e6c9" : "#f5f5f5",
                borderRadius: "8px",
                border: selectedDay === day.day ? "2px solid #1976d2" : "1px solid #e0e0e0",
                cursor: "pointer",
                transition: "all 0.2s",
              }}>
              <div style={{ fontSize: "0.9rem", fontWeight: "bold" }}>Day {day.day}</div>
              <div>{day.completed ? "✅" : "🏋️"}</div>
            </div>
          ))}
        </div>
        {/* Showing more days in a scrollable container */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(60px, 1fr))",
            gap: "10px",
            marginBottom: "2rem",
          }}>
          {challengeDays.slice(25, 100).map(day => (
            <div
              key={day.day}
              onClick={() => selectDay(day.day)}
              style={{
                padding: "10px",
                textAlign: "center",
                backgroundColor: selectedDay === day.day ? "#bbdefb" : day.completed ? "#c8e6c9" : "#f5f5f5",
                borderRadius: "8px",
                border: selectedDay === day.day ? "2px solid #1976d2" : "1px solid #e0e0e0",
                cursor: "pointer",
                transition: "all 0.2s",
              }}>
              <div style={{ fontSize: "0.9rem", fontWeight: "bold" }}>Day {day.day}</div>
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
            <h3 style={{ fontSize: "1.5rem", color: "#1976d2" }}>{selectedDay !== null ? challengeDays[selectedDay - 1].exercise?.name ?? "No exercise assigned" : "No exercise assigned"}</h3>

            <p
              style={{
                backgroundColor: "#efefef",
                padding: "8px 15px",
                borderRadius: "20px",
                display: "inline-block",
                fontSize: "0.9rem",
              }}>
              Equipment: {selectedDay !== null ? challengeDays[selectedDay - 1].exercise?.equipment || "None required" : "None required"}
            </p>

            {/* Two column layout for larger screens */}
            <div
              style={{
                display: "flex",
                flexDirection: "row",
                flexWrap: "wrap",
                gap: "20px",
                marginTop: "20px",
              }}>
              {/* Left column - Image */}
              <div style={{ flex: "1 1 350px" }}>
                {selectedDay !== null && challengeDays[selectedDay - 1]?.exercise?.gifUrl && (
                  <div
                    style={{
                      position: "relative",
                      width: "100%",
                      marginBottom: "15px",
                      borderRadius: "10px",
                      overflow: "hidden",
                    }}>
                    <img
                      src={challengeDays[selectedDay - 1].exercise?.gifUrl}
                      alt={challengeDays[selectedDay - 1].exercise?.name}
                      style={{
                        width: "100%",
                        borderRadius: "10px",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Right column - Timer and controls */}
              <div style={{ flex: "1 1 350px" }}>
                <div
                  style={{
                    backgroundColor: "#e0f7fa",
                    padding: "20px",
                    borderRadius: "10px",
                    marginBottom: "20px",
                    textAlign: "center",
                  }}>
                  <div
                    style={{
                      fontSize: "2.5rem",
                      fontWeight: "bold",
                      marginBottom: "15px",
                      fontFamily: "monospace",
                    }}>
                    {formatTime(timer)}
                  </div>

                  <div style={{ display: "flex", gap: "15px", justifyContent: "center" }}>
                    <button
                      onClick={toggleTimer}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: isRunning ? "#f44336" : "#4caf50",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "1rem",
                        transition: "background-color 0.3s",
                      }}>
                      {isRunning ? "Pause" : "Start"}
                    </button>

                    <button
                      onClick={resetTimer}
                      style={{
                        padding: "10px 20px",
                        backgroundColor: "#757575",
                        color: "white",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "1rem",
                      }}>
                      Reset
                    </button>
                  </div>
                </div>

                {selectedDay !== null && !challengeDays[selectedDay - 1].completed && (
                  <button
                    onClick={completeExercise}
                    style={{
                      width: "100%",
                      padding: "15px",
                      backgroundColor: "#2e7d32",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "1.1rem",
                      fontWeight: "bold",
                      marginBottom: "20px",
                    }}>
                    Complete Exercise
                  </button>
                )}

                {selectedDay !== null && challengeDays[selectedDay - 1].completed && (
                  <div
                    style={{
                      backgroundColor: "#e8f5e9",
                      padding: "15px",
                      borderRadius: "5px",
                      marginBottom: "20px",
                      textAlign: "center",
                    }}>
                    <p style={{ fontSize: "1.1rem", fontWeight: "bold", color: "#2e7d32" }}>✅ Completed in {formatTime(challengeDays[selectedDay - 1].timeSpent || 0)}</p>
                    <p style={{ fontSize: "0.9rem", color: "#757575" }}>Completed on: {challengeDays[selectedDay - 1].date || "Unknown date"}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        ;{/* OpenAI Guidance Section */}
        <div style={{ marginTop: "30px" }}>
          <h3
            style={{
              fontSize: "1.2rem",
              marginBottom: "15px",
              borderBottom: "1px solid #e0e0e0",
              paddingBottom: "8px",
            }}>
            Get Exercise Guidance
          </h3>

          <form
            onSubmit={handleGuidanceSubmit}
            style={{
              display: "flex",
              gap: "10px",
              marginBottom: "20px",
            }}>
            <input
              type='text'
              placeholder={`Ask anything about ${selectedDay !== null ? challengeDays[selectedDay - 1].exercise?.name : ""}...`}
              name='prompt'
              style={{
                flex: "1",
                padding: "10px 15px",
                border: "1px solid #e0e0e0",
                borderRadius: "4px",
                fontSize: "1rem",
              }}
            />
            <button
              style={{
                padding: "10px 20px",
                backgroundColor: "#1976d2",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "1rem",
              }}>
              Get Guidance
            </button>
          </form>

          {selectedDay !== null && challengeDays[selectedDay - 1].exercise?.guidance && (
            <div
              style={{
                backgroundColor: "#f5f5f5",
                padding: "20px",
                borderRadius: "8px",
                marginTop: "10px",
                border: "1px solid #e0e0e0",
                lineHeight: "1.6",
              }}
              dangerouslySetInnerHTML={{ __html: challengeDays[selectedDay - 1].exercise?.guidance ?? "" }}
            />
          )}
        </div>
        {/* Share Completion Section */}
        {selectedDay !== null && challengeDays[selectedDay - 1].completed && (
          <div
            style={{
              marginTop: "2rem",
              backgroundColor: "#e3f2fd",
              padding: "20px",
              borderRadius: "10px",
              textAlign: "center",
            }}>
            <h2 style={{ color: "#1565c0", marginBottom: "10px" }}>Share Your Achievement</h2>
            <p style={{ marginBottom: "15px" }}>{shareMessage}</p>
            <button
              onClick={shareCompletion}
              style={{
                padding: "12px 25px",
                backgroundColor: "#1565c0",
                color: "white",
                border: "none",
                borderRadius: "30px",
                cursor: "pointer",
                fontSize: "1rem",
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
              }}>
              <span>Share on Social Media</span>
            </button>
          </div>
        )}
      </div>

      {/* Render the modal */}
      <ResetConfirmationModal />

      {/* Add CSS animation for modal */}
      <style>{`
        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
      `}</style>
    </>
  );
};

export default ExerciseChallenge;
