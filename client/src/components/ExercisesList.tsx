import React, { useState } from "react";
import axios from "axios";

interface Exercise {
  name: string;
  equipment: string;
  gifUrl: string;
}

const ExercisesList: React.FC = () => {
  const [muscle, setMuscle] = useState<string>("cardio"); // קבוצת שרירים ברירת מחדל
  const [exercises, setExercises] = useState<Exercise[]>([]);

  const fetchExercises = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/exercises/${muscle}`);
      setExercises(response.data as Exercise[]);
      console.log(response.data);
    } catch (error) {
      console.error("שגיאה בקבלת האימונים:", error);
    }
  };

  return (
    <>
      <h2>🔥 אימונים קצרים</h2>
      <select onChange={e => setMuscle(e.target.value)}>
        <option value='cardio'>cardio</option>
        <option value='chest'>חזה</option>
        <option value='back'>גב</option>
      </select>
      <button onClick={fetchExercises}>קבל אימונים</button>

      <ul>
        {exercises.map((exercise, index) => (
          <li key={index}>
            <strong>{exercise.name}</strong> - {exercise.equipment}
            <br />
            <img src={exercise.gifUrl} alt={exercise.name} width='100' />
          </li>
        ))}
      </ul>
    </>
  );
};

export default ExercisesList;
