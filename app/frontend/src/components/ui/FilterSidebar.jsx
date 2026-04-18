import React from "react";
import MoodButton from "./MoodButton";
import {
  MOOD_OPTIONS,
  EXCLUSION_RULES,
  PREFERENCE_OPTIONS,
  EXCLUSION_OPTIONS,
} from "../../constants/preferences";

export default function FilterSidebar({
  timeBuckets,
  bucketIndex,
  setBucketIndex,
  getDisplayTime,
  peopleBuckets,
  peopleIndex,
  setPeopleIndex,
  getDisplayPeople,
  selectedMoods,
  toggleMood,
  preference,
  setPreference,
  selectedExclusions,
  toggleExclusion,
}) {
  return (
    <div className="flex flex-wrap items-center justify-center py-4 px-6 bg-white border-b border-slate-200 gap-8 shadow-sm z-0 w-full">
      <div className="flex flex-col gap-4 w-48">
        {/* Time Slider */}
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex justify-between">
            <span>Time Limit</span>
            <span className="text-indigo-600 font-bold">
              {getDisplayTime()}
            </span>
          </label>
          <input
            type="range"
            min="0"
            max={timeBuckets.length - 1}
            step="1"
            value={bucketIndex}
            onChange={(e) => setBucketIndex(parseInt(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>

        {/* People Slider */}
        <div className="flex flex-col">
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 flex justify-between">
            <span>People</span>
            <span className="text-indigo-600 font-bold">
              {getDisplayPeople()}
            </span>
          </label>
          <input
            type="range"
            min="0"
            max={peopleBuckets.length - 1}
            step="1"
            value={peopleIndex}
            onChange={(e) => setPeopleIndex(parseInt(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>
      </div>

      {/* Mood Choices */}
      <div className="flex flex-col">
        <label className="text-xs font-bold text-slate-500 uppercase mb-1">
          Mood
        </label>
        <div className="grid grid-rows-2 grid-flow-col gap-2">
          {MOOD_OPTIONS.map((mood) => {
            const rivalMood = EXCLUSION_RULES[mood];
            const isDisabled = rivalMood && selectedMoods.includes(rivalMood);

            return (
              <MoodButton
                key={mood}
                label={mood}
                isSelected={selectedMoods.includes(mood)}
                isDisabled={isDisabled}
                onClick={() => toggleMood(mood)}
              />
            );
          })}
        </div>
      </div>

      {/* Preferences */}
      <div className="flex flex-col w-36">
        <label className="text-xs font-bold text-slate-500 uppercase mb-1">
          Preferences
        </label>
        <select
          value={preference}
          onChange={(e) => setPreference(e.target.value)}
          className="w-full px-2 py-1 bg-slate-50 border border-slate-200 rounded-md text-sm outline-indigo-600"
        >
          {PREFERENCE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </div>

      {/* Exclusions choices */}
      <div className="flex flex-col">
        <label className="text-xs font-bold text-slate-500 uppercase mb-1">
          Exclusions (Allergies & Intolerances)
        </label>
        <div className="grid grid-rows-2 grid-flow-col gap-2">
          {EXCLUSION_OPTIONS.map((item) => (
            <MoodButton
              key={item}
              label={item}
              isSelected={selectedExclusions.includes(item)}
              onClick={() => toggleExclusion(item)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
