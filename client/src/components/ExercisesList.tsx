import React, { useRef, useState, useEffect } from "react";
import axios from "axios";
import NavBar from "./NavBar/NavBar";
import { httpService } from "../httpService";

const muscleGroups = ["back", "cardio", "chest", "lower arms", "lower legs", "neck", "shoulders", "upper arms", "upper legs", "waist"];

interface Exercise {
  name: string;
  equipment: string;
  gifUrl: string;
  guidance?: string;
}

const ExercisesList: React.FC = () => {
  const [muscle, setMuscle] = useState<string>("cardio");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [timers, setTimers] = useState<{ [key: string]: number }>({});
  const [running, setRunning] = useState<{ [key: string]: boolean }>({});

  const intervals = useRef<{ [key: string]: NodeJS.Timeout | null }>({});
  const runningState = useRef<{ [key: string]: boolean }>({});

  const fetchExercises = async () => {
    try {
      const response = await axios.get<Exercise[]>(`http://localhost:3001/api/exercises/${muscle}`);
      setExercises(response.data);
      console.log(response.data);

      const initialTimers: { [key: string]: number } = {};
      const initialRunning: { [key: string]: boolean } = {};
      response.data.forEach(exercise => {
        initialTimers[exercise.name] = 0;
        initialRunning[exercise.name] = false;
        intervals.current[exercise.name] = null;
        runningState.current[exercise.name] = false;
      });

      setTimers(initialTimers);
      setRunning(initialRunning);
    } catch (error) {
      console.error("error", error);
    }
  };

  // call to api
  useEffect(() => {
    fetchExercises();
  }, [muscle]);

  // Start or stop a timer
  const toggleTimer = (exerciseName: string) => {
    const isRunning = !runningState.current[exerciseName];
    runningState.current[exerciseName] = isRunning;
    setRunning(prev => ({ ...prev, [exerciseName]: isRunning }));

    if (isRunning) {
      intervals.current[exerciseName] = setInterval(() => {
        setTimers(prevTimers => ({
          ...prevTimers,
          [exerciseName]: prevTimers[exerciseName] + 1,
        }));
      }, 1000);
    } else {
      if (intervals.current[exerciseName]) {
        clearInterval(intervals.current[exerciseName]!);
        intervals.current[exerciseName] = null;
      }
    }
  };

  // Reset timer
  const resetTimer = (exerciseName: string) => {
    if (intervals.current[exerciseName]) {
      clearInterval(intervals.current[exerciseName]!);
      intervals.current[exerciseName] = null;
    }

    runningState.current[exerciseName] = false;
    setRunning(prev => ({ ...prev, [exerciseName]: false }));
    setTimers(prevTimers => ({ ...prevTimers, [exerciseName]: 0 }));
  };

  const handleSubmit = async (e: React.FormEvent, exerciseName: string, index: number) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const prompt = formData.get("prompt") as string;

    const response = await httpService.post<{ response: string }>("http://localhost:3001/api/exercises/guidance", { exercise: exerciseName, prompt });

    setExercises(prevExercises => {
      const updatedExercises = [...prevExercises];
      updatedExercises[index].guidance = formatResponse(response.data.response);
      return updatedExercises;
    });
  };

  return (
    <>
      <NavBar />
      <br />
      <div className='Workout' style={{ margin: "5rem" }}>
        <h2> Short training</h2>
        <select onChange={e => setMuscle(e.target.value)} value={muscle}>
          {muscleGroups.map((group, index) => (
            <option key={index} value={group}>
              {group}
            </option>
          ))}
        </select>

        <button onClick={fetchExercises}>Get training</button>
      </div>

      <ul>
        {exercises.map((exercise, index) => (
          <li key={index}>
            <strong>{exercise.name}</strong> - {exercise.equipment}
            <br />
            {exercise.gifUrl && <img src={exercise.gifUrl} alt={exercise.name} width='150' />}
            <br />
            <button onClick={() => toggleTimer(exercise.name)}>{running[exercise.name] ? "Pause" : "Start"}</button>
            <button onClick={() => resetTimer(exercise.name)}>Reset</button>
            <div> Timer: {timers[exercise.name]} seconds</div>
            <form onSubmit={e => handleSubmit(e, exercise.name, index)}>
              <input type='text' placeholder='Ask anything about this exercise' name='prompt' />
              <button>Submit</button>
            </form>
            {exercise.guidance && <p style={{ whiteSpace: "break-spaces" }} dangerouslySetInnerHTML={{ __html: exercise.guidance }} />}
          </li>
        ))}
      </ul>
    </>
  );
};

export default ExercisesList;

function formatResponse(response: string): string {
  return response
    .replace(/\*\*(.*?)\*\*/g, "<b>$1</b>") // Convert **text** to <b>text</b>
    .replace(/\n\n-/g, "\n-"); // Ensure single newline before bullets
}
