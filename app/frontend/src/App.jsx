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
  // TO BE DELETED WHEN HOOKED UP WITH BACKEND
  // mockRecipe was just to see the formatting
  const mockRecipe = {
    title: "Oulu-Style Mediterranean Salmon",
    time: "25 min",
    servings: "2 People",
    ingredients: [
      "2 Salmon fillets (fresh from the market)",
      "1 tsp Dried oregano",
      "1 Lemon (sliced)",
      "2 cloves Garlic (minced)",
      "1 cup Cherry tomatoes",
      "Fresh parsley for garnish",
    ],
    instructions: [
      "Preheat your oven to 200°C.",
      "Place salmon on a baking sheet and season with garlic, oregano, and salt.",
      "Arrange lemon slices and tomatoes around the fish.",
      "Bake for 12-15 minutes until the salmon flakes easily with a fork.",
      "Garnish with parsley and serve immediately.",
    ],
  };

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
      text: "Moi! I'm your POOR assistant. Ready to cook something great in Oulu today?",
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isTyping) return;

    const newUserMessage = {
      id: Date.now(),
      role: "user",
      text: inputValue,
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInputValue("");
    setIsTyping(true);

    // TO BE DELETED WHEN HOOKED UP WITH BACKEND
    // Fake timeout to see how it looked without real data.
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          role: "ai",
          text: "I've scanned your library! Based on your filters, I found a great match in your 'Mediterranean' book. Loading it now...",
        },
      ]);
      setIsTyping(false);
    }, 2000);
  };

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /* RECIPE LOGIC */
  // TO BE DELETED: Not really... The state stays but it will initialize as `null` instead of `mockRecipe`
  const [currentRecipe, setCurrentRecipe] = useState(mockRecipe);

  /* SHOPPING LIST LOGIC */
  const [shoppingList, setShoppingList] = useState(() => {
    // TO BE DELETED WHEN HOOKED UP WITH BACKEND
    return mockRecipe.ingredients.map((ing, index) => ({
      id: index,
      name: ing,
      checked: false,
    }));
  });

  useEffect(() => {
    if (currentRecipe) {
      const items = currentRecipe.ingredients.map((ing, index) => ({
        id: index,
        name: ing,
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

  const findPrices = async () => {
    setIsFetchingPrices(true);

    // TO BE DELETED WHEN HOOKED UP WITH BACKEND
    // This will trigger Playwright, to do the actual scraping and return the real prices.
    setTimeout(() => {
      setShoppingList((prev) =>
        prev.map((item) => ({
          ...item,
          // Giving each item a random price between 1€ and 8€
          price: (Math.random() * 7 + 1).toFixed(2) + "€",
        })),
      );
      setIsFetchingPrices(false);
    }, 2500);
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
            messages={messages}
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
