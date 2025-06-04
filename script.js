const typed = new Typed('#typed-text', {
    strings: ['Track your fitness', 'Monitor your nutrition', 'Improve your sleep', 'Connect with experts'],
    typeSpeed: 50,
    backSpeed: 30,
    loop: true
});

document.getElementById('addFoodForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const foodName = document.getElementById('foodName').value;
    const calories = document.getElementById('calories').value;
    const protein = document.getElementById('protein').value;
    const carbs = document.getElementById('carbs').value;
    const fats = document.getElementById('fats').value;
    const mealType = document.getElementById('mealType').value;

    const foodItem = {
        name: foodName,
        calories: parseInt(calories),
        protein: parseInt(protein),
        carbs: parseInt(carbs),
        fats: parseInt(fats)
    };

    const mealList = document.getElementById(`${mealType.toLowerCase()}List`);
    const listItem = document.createElement('li');
    listItem.textContent = `${foodName} - ${calories} calories`;
    mealList.appendChild(listItem);

    updateCaloriesStat(parseInt(calories));
    this.reset();
});

function updateCaloriesStat(calories) {
    const currentCalories = parseInt(document.getElementById('totalCalories').textContent);
    document.getElementById('totalCalories').textContent = currentCalories + calories;
}

let meditationTimer;
let meditationDuration = 0;

document.getElementById('startMeditation').addEventListener('click', function() {
    const duration = parseInt(document.getElementById('meditationDuration').value);
    meditationDuration = duration * 60;
    let timeLeft = meditationDuration;

    this.disabled = true;
    document.getElementById('stopMeditation').disabled = false;

    meditationTimer = setInterval(() => {
        timeLeft--;
        const minutes = Math.floor(timeLeft / 60);
        const seconds = timeLeft % 60;
        document.getElementById('meditationTimer').textContent = 
            `${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (timeLeft <= 0) {
            clearInterval(meditationTimer);
            this.disabled = false;
            document.getElementById('stopMeditation').disabled = true;
            alert('Meditation session complete!');
        }
    }, 1000);
});

document.getElementById('stopMeditation').addEventListener('click', function() {
    clearInterval(meditationTimer);
    document.getElementById('startMeditation').disabled = false;
    this.disabled = true;
    document.getElementById('meditationTimer').textContent = '0:00';
});

document.getElementById('moodForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const mood = document.getElementById('mood').value;
    const note = document.getElementById('moodNote').value;
    const date = new Date().toISOString().split('T')[0];

    const moodEntry = {
        date: date,
        mood: mood,
        note: note
    };

    const moodList = document.getElementById('moodList');
    const listItem = document.createElement('li');
    listItem.textContent = `${date}: ${mood} - ${note}`;
    moodList.appendChild(listItem);

    this.reset();
});

document.getElementById('workoutForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const exercise = document.getElementById('exercise').value;
    const sets = document.getElementById('sets').value;
    const reps = document.getElementById('reps').value;
    const weight = document.getElementById('weight').value;

    const workoutEntry = {
        exercise: exercise,
        sets: parseInt(sets),
        reps: parseInt(reps),
        weight: parseInt(weight)
    };

    const workoutList = document.getElementById('workoutList');
    const listItem = document.createElement('li');
    listItem.textContent = `${exercise}: ${sets} sets x ${reps} reps @ ${weight}kg`;
    workoutList.appendChild(listItem);

    this.reset();
});

document.getElementById('sleepForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const sleepTime = document.getElementById('sleepTime').value;
    const wakeTime = document.getElementById('wakeTime').value;
    const quality = document.getElementById('sleepQuality').value;

    const sleepEntry = {
        sleepTime: sleepTime,
        wakeTime: wakeTime,
        quality: quality
    };

    const sleepList = document.getElementById('sleepList');
    const listItem = document.createElement('li');
    listItem.textContent = `Slept: ${sleepTime} - Woke: ${wakeTime} (Quality: ${quality})`;
    sleepList.appendChild(listItem);

    this.reset();
});

document.getElementById('connectForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const gymName = document.getElementById('gymName').value;
    const activity = document.getElementById('activity').value;
    const schedule = document.getElementById('schedule').value;

    const connectionRequest = {
        gymName: gymName,
        activity: activity,
        schedule: schedule
    };

    alert('Connection request sent! We will notify you when someone matches your preferences.');
    this.reset();
});

document.getElementById('bookConsultation').addEventListener('click', function() {
    const expertName = document.getElementById('expertName').textContent;
    const date = document.getElementById('consultationDate').value;
    const time = document.getElementById('consultationTime').value;

    if (!date || !time) {
        alert('Please select both date and time for the consultation.');
        return;
    }

    alert(`Consultation booked with ${expertName} on ${date} at ${time}`);
});

document.querySelectorAll('.time-slot').forEach(slot => {
    slot.addEventListener('click', function() {
        document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
        this.classList.add('selected');
        document.getElementById('consultationTime').value = this.dataset.time;
    });
});

document.getElementById('searchGyms').addEventListener('click', function() {
    const location = document.getElementById('location').value;
    const activity = document.getElementById('activity').value;

    if (!location) {
        alert('Please enter your location');
        return;
    }

    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '<li>Loading gyms near you...</li>';

    setTimeout(() => {
        searchResults.innerHTML = `
            <li>
                <h4>Fitness First</h4>
                <p>2.5 km away</p>
                <button onclick="viewDetails('fitness-first')">View Details</button>
            </li>
            <li>
                <h4>Gold's Gym</h4>
                <p>3.1 km away</p>
                <button onclick="viewDetails('golds-gym')">View Details</button>
            </li>
        `;
    }, 1000);
});

document.getElementById('findMatches').addEventListener('click', function() {
    const activity = document.getElementById('activity').value;
    const schedule = document.getElementById('schedule').value;

    if (!activity || !schedule) {
        alert('Please select both activity and schedule');
        return;
    }

    const matchesList = document.getElementById('matchesList');
    matchesList.innerHTML = '<li>Finding workout buddies...</li>';

    setTimeout(() => {
        matchesList.innerHTML = `
            <li>
                <h4>John Doe</h4>
                <p>Interested in: ${activity}</p>
                <p>Available: ${schedule}</p>
                <button onclick="connect('john-doe')">Connect</button>
            </li>
            <li>
                <h4>Jane Smith</h4>
                <p>Interested in: ${activity}</p>
                <p>Available: ${schedule}</p>
                <button onclick="connect('jane-smith')">Connect</button>
            </li>
        `;
    }, 1000);
});

function viewDetails(gymId) {
    const detailsSection = document.getElementById('gymDetails');
    detailsSection.style.display = 'block';
    detailsSection.innerHTML = `
        <h3>Gym Details</h3>
        <p>Loading details for ${gymId}...</p>
    `;

    setTimeout(() => {
        detailsSection.innerHTML = `
            <h3>Gym Details</h3>
            <p>Address: 123 Fitness Street</p>
            <p>Hours: 6AM - 10PM</p>
            <p>Membership: $50/month</p>
            <button onclick="bookClass('${gymId}')">Book a Class</button>
        `;
    }, 500);
}

document.getElementById('searchExperts').addEventListener('click', function() {
    const specialty = document.getElementById('specialty').value;
    const availability = document.getElementById('availability').value;

    if (!specialty || !availability) {
        alert('Please select both specialty and availability');
        return;
    }

    const expertsList = document.getElementById('expertsList');
    expertsList.innerHTML = '<li>Searching for experts...</li>';

    setTimeout(() => {
        expertsList.innerHTML = `
            <li>
                <h4>Dr. Sarah Johnson</h4>
                <p>Specialty: ${specialty}</p>
                <p>Available: ${availability}</p>
                <button onclick="viewExpertDetails('sarah-johnson')">View Profile</button>
            </li>
            <li>
                <h4>Dr. Michael Brown</h4>
                <p>Specialty: ${specialty}</p>
                <p>Available: ${availability}</p>
                <button onclick="viewExpertDetails('michael-brown')">View Profile</button>
            </li>
        `;
    }, 1000);
});

function viewExpertDetails(expertId) {
    const detailsSection = document.getElementById('expertDetails');
    detailsSection.style.display = 'block';
    detailsSection.innerHTML = `
        <h3>Expert Profile</h3>
        <p>Loading profile for ${expertId}...</p>
    `;

    setTimeout(() => {
        detailsSection.innerHTML = `
            <h3>Expert Profile</h3>
            <p>Experience: 10 years</p>
            <p>Specialization: Nutrition and Diet</p>
            <p>Rating: 4.8/5</p>
            <button onclick="bookConsultation('${expertId}')">Book Consultation</button>
        `;
    }, 500);
}