import React, { useState, useEffect, useRef } from "react";
import DashboardColumn from "./components/ui/DashboardColumn";
import MoodButton from "./components/ui/MoodButton";
import FilterSidebar from "./components/ui/FilterSidebar";
import ChatBox from "./components/ui/ChatBox";
import { OULU_STORES } from "./constants/ouluStores";
import ShoppingColumn from "./components/ui/ShoppingColumn";
import RecipeDisplay from "./components/ui/RecipeDisplay";
import Header from "./components/ui/Header";

export default function App() {
  /* TIME LIMIT LOGIC */
  const timeBuckets = [5, 15, 30, 45, 60, 90, 120];
  const [bucketIndex, setBucketIndex] = useState(2);

  const getDisplayTime = () => {
    const minutes = timeBuckets[bucketIndex];
    if (minutes >= 120) return "2+ Hours";
    return `${minutes} min`;
  };

  /* PEOPLE LOGIC */
  const peopleBuckets = [1, 2, 4, 6, 8, 12];
  const [peopleIndex, setPeopleIndex] = useState(1);

  const getDisplayPeople = () => {
    const count = peopleBuckets[peopleIndex];
    if (count >= 12) return "12+ People";
    return count === 1 ? "1 Person" : `${count} People`;
  };

  /* MOODS LOGIC */
  const [selectedMoods, setSelectedMoods] = useState([]);

  const toggleMood = (mood) => {
    setSelectedMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood],
    );
  };

  /* PREFERENCE LOGIC & EXCLUSION LOGIC */
  const [preference, setPreference] = useState("None");
  const [selectedExclusions, setSelectedExclusions] = useState([]);

  const toggleExclusion = (item) => {
    setSelectedExclusions((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  };

  /* CHAT LOGIC */
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "ai",
      text: "Moi, I'm your POOR Cook! What are we cooking today? Let me know if you have any preferences or ingredients on hand!",
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const userText = inputValue;
    const newUserMessage = {
      id: Date.now(),
      role: "user",
      text: userText,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue("");
    setIsTyping(true);

    const aiMessageId = Date.now() + 1;
    setMessages((prev) => [...prev, { id: aiMessageId, role: "ai", text: "" }]);

    const currentPreferences = {
      time: getDisplayTime(),
      servings: getDisplayPeople(),
      mood:
        selectedMoods.length > 0
          ? selectedMoods.join(", ")
          : "No specific mood",
      meal_type: preference === "None" ? "No specific preference" : preference,
      allergies: selectedExclusions.length > 0 ? selectedExclusions : ["None"],
    };

    try {
      const response = await fetch("http://localhost:8000/chat/stream", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: userText,
          history: messages
            .filter((m) => m.id !== aiMessageId)
            .map((m) => ({ role: m.role, content: m.text })),
          preferences: currentPreferences,
        }),
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let buffer = "";
      let aiFullText = "";
      let recipeTriggered = false;
      let recipeJsonBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");

        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6).trim();
            if (!dataStr) continue;

            try {
              const parsed = JSON.parse(dataStr);

              if (parsed.type === "text" && parsed.content) {
                let chunkText = parsed.content;

                if (!recipeTriggered) {
                  aiFullText += chunkText;

                  if (aiFullText.includes("[RECIPE_FOUND]")) {
                    console.log(
                      "RECIPE TAG DETECTED! SWITCHING TRACKS TO JSON VAULT",
                    );
                    recipeTriggered = true;

                    const parts = aiFullText.split("[RECIPE_FOUND]");
                    aiFullText = parts[0];
                    recipeJsonBuffer += parts[1] || "";
                  }

                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === aiMessageId
                        ? { ...msg, text: aiFullText }
                        : msg,
                    ),
                  );
                } else {
                  recipeJsonBuffer += chunkText;
                }
              } else if (parsed.type === "done") {
                if (recipeTriggered && recipeJsonBuffer.trim()) {
                  try {
                    console.log("Attempting to parse JSON:", recipeJsonBuffer);
                    const finalRecipe = JSON.parse(recipeJsonBuffer);
                    const recipeWithTags = {
                      ...finalRecipe,
                      tags: {
                        mood: currentPreferences.mood,
                        meal_type: currentPreferences.meal_type,
                        allergies: currentPreferences.allergies,
                      },
                    };

                    setCurrentRecipe(recipeWithTags);
                    console.log("UI Updated successfully!");
                  } catch (parseError) {
                    console.error("Uh oh, the AI sent bad JSON:", parseError);
                    console.log("Raw broken string:", recipeJsonBuffer);
                  }
                }
              }
            } catch (error) {
              // Silently ignore split stream chunks
            }
          }
        }
      }
    } catch (error) {
      console.error("Error fetching stream:", error);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === aiMessageId
            ? { ...msg, text: "Ugh, the stove broke. Connection error!" }
            : msg,
        ),
      );
    } finally {
      setIsTyping(false);
    }
  };

  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /* RECIPE LOGIC */
  const [currentRecipe, setCurrentRecipe] = useState(null);

  /* SHOPPING LIST LOGIC */
  const [shoppingList, setShoppingList] = useState([]);

  useEffect(() => {
    if (currentRecipe) {
      // The AI now returns an array of objects: { name: "...", search_term: "..." }
      const items = currentRecipe.ingredients.map((ingObj, index) => ({
        id: index,
        name: ingObj.name, // What the user sees (e.g., "0.7 lbs chicken thighs")
        searchTerm: ingObj.search_term, // What the scraper uses (e.g., "kana")
        checked: false,
      }));
      setShoppingList(items);
    }
  }, [currentRecipe]);

  const toggleItem = (id) => {
    setShoppingList((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item,
      ),
    );
  };

  const clearList = () => {
    setShoppingList((prev) =>
      prev.map((item) => ({ ...item, checked: false })),
    );
  };

  const [selectedStore, setSelectedStore] = useState(OULU_STORES[0].id);
  const [isFetchingPrices, setIsFetchingPrices] = useState(false);

  // REPLACED DUMMY FUNCTION WITH REAL BACKEND CALL
  const findPrices = async () => {
    if (shoppingList.length === 0) return;

    setIsFetchingPrices(true);

    try {
      // 1. Extract the FINNISH search terms to send to the backend
      const searchTerms = shoppingList.map((item) => item.searchTerm);

      // 2. Make the POST request to our endpoint
      const response = await fetch("http://localhost:8000/shop/ingredients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          store_id: selectedStore,
          ingredients: searchTerms, // Pass the clean keywords here!
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      const priceData = result.data;

      // 3. Update the shopping list state with the new prices
      setShoppingList((prevList) =>
        prevList.map((item) => {
          // Look up the price using the Finnish searchTerm, not the English name
          const itemPrices = priceData[item.searchTerm];

          if (itemPrices && itemPrices.length > 0) {
            return { ...item, price: itemPrices[0].price };
          }

          return { ...item, price: "Not found" };
        }),
      );
    } catch (error) {
      console.error("Failed to fetch prices:", error);
    } finally {
      setIsFetchingPrices(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 font-sans text-slate-900">
      <Header />

      <FilterSidebar
        timeBuckets={timeBuckets}
        bucketIndex={bucketIndex}
        setBucketIndex={setBucketIndex}
        getDisplayTime={getDisplayTime}
        peopleBuckets={peopleBuckets}
        peopleIndex={peopleIndex}
        setPeopleIndex={setPeopleIndex}
        getDisplayPeople={getDisplayPeople}
        selectedMoods={selectedMoods}
        toggleMood={toggleMood}
        preference={preference}
        setPreference={setPreference}
        selectedExclusions={selectedExclusions}
        toggleExclusion={toggleExclusion}
      />

      <main className="flex-1 flex overflow-hidden w-full">
        <DashboardColumn
          title="POOR Cook Chat"
          widthClass="w-1/4 min-w-[300px]"
        >
          <ChatBox
            messages={messages.filter((msg) => msg.text !== "")}
            isTyping={isTyping}
            inputValue={inputValue}
            setInputValue={setInputValue}
            handleSendMessage={handleSendMessage}
            messagesEndRef={messagesEndRef}
          />
        </DashboardColumn>

        <DashboardColumn
          title="Recipe"
          bgColor="bg-slate-50"
          widthClass="w-2/4 min-w-[300px]"
        >
          <RecipeDisplay
            currentRecipe={currentRecipe}
            setCurrentRecipe={setCurrentRecipe}
          />
        </DashboardColumn>

        <DashboardColumn title="Shopping List" widthClass="w-1/4 min-w-[300px]">
          <ShoppingColumn
            selectedStore={selectedStore}
            setSelectedStore={setSelectedStore}
            findPrices={findPrices}
            isFetchingPrices={isFetchingPrices}
            shoppingList={shoppingList}
            clearList={clearList}
            toggleItem={toggleItem}
          />
        </DashboardColumn>
      </main>
    </div>
  );
}
