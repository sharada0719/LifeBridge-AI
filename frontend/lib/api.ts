const BASE_URL = "http://localhost:8000/api";

// Helper to get local storage safe for SSR
const getStorage = () => {
  if (typeof window !== "undefined") {
    return window.localStorage;
  }
  return null;
};

// Mock data fallbacks for full offline interactivity
const mockStorage = {
  user: { id: "mock-uid", name: "Jane Doe", email: "jane@lifebridge.ai", role: "citizen", phone: "+1 (555) 019-2834", latitude: 40.7128, longitude: -74.0060, created_at: new Date().toISOString() },
  token: "mock-jwt-token-val",
  contacts: [
    { id: "c1", name: "David Doe", phone: "+1 (555) 911-3000", relationship: "Spouse", is_trusted: true },
    { id: "c2", name: "Sarah Connor", phone: "+1 (555) 900-1122", relationship: "Mother", is_trusted: true }
  ],
  requests: [
    { id: "r1", user_id: "mock-uid", emergency_type: "flood", description: "Water level is rising up to first floor. Need rescue assistance.", severity: "critical", status: "pending", latitude: 40.7128, longitude: -74.0060, created_at: new Date().toISOString(), updated_at: new Date().toISOString() }
  ],
  shelters: [
    { id: "s1", name: "Community Safe Haven - West Wing", location_desc: "404 Resilience Blvd, Near Metro Station", latitude: 40.7128, longitude: -74.0060, capacity: 250, current_occupancy: 45, contact_info: "+1 (555) 123-4567" },
    { id: "s2", name: "St. Jude Emergency Center", location_desc: "92 Grace Ave, High Grounds", latitude: 40.7306, longitude: -73.9352, capacity: 150, current_occupancy: 110, contact_info: "+1 (555) 987-6543" },
    { id: "s3", name: "Downtown Public Gym Shelter", location_desc: "12 Stadium Way, Block B", latitude: 40.7580, longitude: -73.9855, capacity: 400, current_occupancy: 15, contact_info: "+1 (555) 456-7890" }
  ],
  hospitals: [
    { id: "h1", name: "Metro General Trauma Hospital", address: "100 Healing Way, Downtown", latitude: 40.7128, longitude: -74.0060, contact_info: "+1 (555) 911-0100", total_beds: 200, available_beds: 48 },
    { id: "h2", name: "Hope Medical Emergency Center", address: "75 Recovery Lane, Uptown", latitude: 40.7306, longitude: -73.9352, contact_info: "+1 (555) 911-0200", total_beds: 120, available_beds: 12 },
    { id: "h3", name: "Mercy Red Cross Station", address: "5 Field Clinic, East District", latitude: 40.7580, longitude: -73.9855, contact_info: "+1 (555) 911-0300", total_beds: 50, available_beds: 35 }
  ],
  volunteers: [
    { id: "v1", user_id: "mock-uid", skill_set: "First Aid, Water Rescue", status: "active", current_lat: 40.7128, current_lng: -74.0060, user: { name: "Jane Doe", email: "jane@lifebridge.ai" } },
    { id: "v2", user_id: "u2", skill_set: "Medical Doctor, Surgery", status: "active", current_lat: 40.7306, current_lng: -73.9352, user: { name: "Dr. Alice Smith", email: "alice@hospitals.org" } }
  ],
  resources: [
    { id: "rs1", name: "Packaged Drinking Water", type: "water", quantity: 5000, status: "available", latitude: 40.7128, longitude: -74.0060 },
    { id: "rs2", name: "MRE Meals (Ready-to-Eat)", type: "food", quantity: 2500, status: "available", latitude: 40.7128, longitude: -74.0060 },
    { id: "rs3", name: "Advanced First Aid Kit", type: "medical_kit", quantity: 450, status: "available", latitude: 40.7306, longitude: -73.9352 },
    { id: "rs4", name: "Thermal Safety Blanket", type: "blanket", quantity: 1200, status: "available", latitude: 40.7580, longitude: -73.9855 },
    { id: "rs5", name: "Inflatable Life Jackets", type: "life_jacket", quantity: 300, status: "available", latitude: 40.7306, longitude: -73.9352 }
  ],
  notifications: [
    { id: "n1", title: "🔴 Flash Flood Warning - Evacuation Advised", message: "High-risk flooding expected in low-lying coastal areas. Emergency teams are active. Evacuate to the nearest designated shelter immediately.", type: "alert", is_read: false, created_at: new Date().toISOString() },
    { id: "n2", title: "🟢 Volunteer Network Activated", message: "Rescue operations have started in the West sector. Registered volunteers, please check-in via your dashboard status panel.", type: "info", is_read: false, created_at: new Date().toISOString() }
  ]
};

// Initialize client mock storage if window is defined
const initMockDB = () => {
  const store = getStorage();
  if (store) {
    if (!store.getItem("lb_token")) {
      store.setItem("lb_token", "mock-jwt-token");
    }
    if (!store.getItem("lb_user")) {
      store.setItem("lb_user", JSON.stringify(mockStorage.user));
    }
    if (!store.getItem("lb_contacts")) {
      store.setItem("lb_contacts", JSON.stringify(mockStorage.contacts));
    }
    if (!store.getItem("lb_requests")) {
      store.setItem("lb_requests", JSON.stringify(mockStorage.requests));
    }
    if (!store.getItem("lb_shelters")) {
      store.setItem("lb_shelters", JSON.stringify(mockStorage.shelters));
    }
    if (!store.getItem("lb_hospitals")) {
      store.setItem("lb_hospitals", JSON.stringify(mockStorage.hospitals));
    }
    if (!store.getItem("lb_volunteers")) {
      store.setItem("lb_volunteers", JSON.stringify(mockStorage.volunteers));
    }
    if (!store.getItem("lb_resources")) {
      store.setItem("lb_resources", JSON.stringify(mockStorage.resources));
    }
    if (!store.getItem("lb_notifications")) {
      store.setItem("lb_notifications", JSON.stringify(mockStorage.notifications));
    }
  }
};

// Perform initial mock DB check
if (typeof window !== "undefined") {
  initMockDB();
}

async function request(endpoint: string, options: RequestInit = {}) {
  const token = getStorage()?.getItem("lb_token");
  const isFormData = options.body instanceof FormData;
  
  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
    
    if (!res.ok) {
      const errorText = await res.text();
      let errorJSON;
      try {
        errorJSON = JSON.parse(errorText);
      } catch {
        errorJSON = { detail: errorText || "Unknown API Error" };
      }
      throw new Error(errorJSON.detail || "HTTP Error");
    }
    
    const data = await res.json();
    
    // Caching mechanism: update local cache on successful GETs
    const method = options.method || "GET";
    const store = getStorage();
    if (store && method === "GET") {
      if (endpoint === "/shelters") store.setItem("lb_shelters", JSON.stringify(data));
      else if (endpoint === "/hospitals") store.setItem("lb_hospitals", JSON.stringify(data));
      else if (endpoint === "/notifications") store.setItem("lb_notifications", JSON.stringify(data));
      else if (endpoint === "/volunteers") store.setItem("lb_volunteers", JSON.stringify(data));
      else if (endpoint === "/resources") store.setItem("lb_resources", JSON.stringify(data));
      else if (endpoint === "/users/me/contacts") store.setItem("lb_contacts", JSON.stringify(data));
      else if (endpoint === "/requests/me" || endpoint === "/requests") store.setItem("lb_requests", JSON.stringify(data));
    }
    
    return data;
  } catch (error) {
    console.warn(`API call failed for ${endpoint}. Falling back to client-side database. Error details:`, error);
    
    // Queue offline requests for background sync if we are trying to write (e.g. submit SOS) while offline
    const method = options.method || "GET";
    const store = getStorage();
    if (store && method === "POST" && endpoint === "/requests" && typeof window !== "undefined") {
      try {
        const bodyObj = JSON.parse(options.body as string);
        const offlineQueue = JSON.parse(store.getItem("lb_offline_requests") || "[]");
        offlineQueue.push({ endpoint, body: bodyObj, timestamp: new Date().toISOString() });
        store.setItem("lb_offline_requests", JSON.stringify(offlineQueue));
        console.log("SOS Request queued offline.");
      } catch (e) {
        console.error("Failed to parse request body for offline queue:", e);
      }
    }
    
    return getFallback(endpoint, options);
  }
}

// Client Side Database Fallback logic
function getFallback(endpoint: string, options: RequestInit) {
  const store = getStorage();
  if (!store) return null;

  const method = options.method || "GET";

  // Auth operations
  if (endpoint.startsWith("/auth/login")) {
    const body = JSON.parse(options.body as string);
    const mockUser = { ...mockStorage.user, email: body.email || body.username };
    store.setItem("lb_token", "mock-token-12345");
    store.setItem("lb_user", JSON.stringify(mockUser));
    return { access_token: "mock-token-12345", token_type: "bearer" };
  }
  if (endpoint.startsWith("/auth/register")) {
    const body = JSON.parse(options.body as string);
    const mockUser = {
      id: "u-" + Math.random().toString(36).substring(4),
      name: body.name,
      email: body.email,
      role: body.role || "citizen",
      phone: body.phone || "",
      latitude: body.latitude || 40.7128,
      longitude: body.longitude || -74.0060,
      created_at: new Date().toISOString()
    };
    store.setItem("lb_token", "mock-token-register");
    store.setItem("lb_user", JSON.stringify(mockUser));
    return mockUser;
  }
  if (endpoint === "/auth/me") {
    const uStr = store.getItem("lb_user");
    return uStr ? JSON.parse(uStr) : mockStorage.user;
  }

  // Users profile and contacts
  if (endpoint === "/users/me" && method === "PUT") {
    const body = JSON.parse(options.body as string);
    const currUser = JSON.parse(store.getItem("lb_user") || "{}");
    const updated = { ...currUser, ...body };
    store.setItem("lb_user", JSON.stringify(updated));
    return updated;
  }
  if (endpoint === "/users/me/contacts") {
    if (method === "GET") {
      return JSON.parse(store.getItem("lb_contacts") || "[]");
    }
    if (method === "POST") {
      const body = JSON.parse(options.body as string);
      const contacts = JSON.parse(store.getItem("lb_contacts") || "[]");
      const newContact = {
        id: "c-" + Math.random().toString(36).substring(4),
        user_id: "mock-uid",
        ...body
      };
      contacts.push(newContact);
      store.setItem("lb_contacts", JSON.stringify(contacts));
      return newContact;
    }
  }
  if (endpoint.startsWith("/users/me/contacts/")) {
    if (method === "DELETE") {
      const contactId = endpoint.split("/").pop();
      let contacts = JSON.parse(store.getItem("lb_contacts") || "[]");
      contacts = contacts.filter((c: any) => c.id !== contactId);
      store.setItem("lb_contacts", JSON.stringify(contacts));
      return { message: "Contact deleted" };
    }
  }

  // Emergency Requests
  if (endpoint === "/requests") {
    if (method === "GET") {
      return JSON.parse(store.getItem("lb_requests") || "[]");
    }
    if (method === "POST") {
      const body = JSON.parse(options.body as string);
      const requests = JSON.parse(store.getItem("lb_requests") || "[]");
      const user = JSON.parse(store.getItem("lb_user") || "{}");
      const newRequest = {
        id: "r-" + Math.random().toString(36).substring(4),
        user_id: user.id || "mock-uid",
        status: "pending",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        ...body
      };
      requests.unshift(newRequest);
      store.setItem("lb_requests", JSON.stringify(requests));
      
      // Also inject a broadcast alert notification for this critical/high request
      if (body.severity === "critical" || body.severity === "high") {
        const notifs = JSON.parse(store.getItem("lb_notifications") || "[]");
        notifs.unshift({
          id: "n-" + Math.random().toString(36).substring(4),
          title: `⚠️ Critical Distress: ${body.emergency_type.toUpperCase()}`,
          message: `${body.description}. Location: [${body.latitude}, ${body.longitude}]. Assistance requested.`,
          type: "alert",
          is_read: false,
          created_at: new Date().toISOString()
        });
        store.setItem("lb_notifications", JSON.stringify(notifs));
      }

      return newRequest;
    }
  }
  if (endpoint === "/requests/me") {
    const user = JSON.parse(store.getItem("lb_user") || "{}");
    const requests = JSON.parse(store.getItem("lb_requests") || "[]");
    return requests.filter((r: any) => r.user_id === user.id);
  }
  if (endpoint.startsWith("/requests/") && method === "PATCH") {
    const reqId = endpoint.split("/").pop();
    const body = JSON.parse(options.body as string);
    const requests = JSON.parse(store.getItem("lb_requests") || "[]");
    const reqIndex = requests.findIndex((r: any) => r.id === reqId);
    if (reqIndex > -1) {
      requests[reqIndex] = { ...requests[reqIndex], ...body, updated_at: new Date().toISOString() };
      store.setItem("lb_requests", JSON.stringify(requests));
      return requests[reqIndex];
    }
    throw new Error("Emergency request not found");
  }

  // Shelters
  if (endpoint === "/shelters") {
    if (method === "GET") {
      return JSON.parse(store.getItem("lb_shelters") || "[]");
    }
    if (method === "POST") {
      const body = JSON.parse(options.body as string);
      const shelters = JSON.parse(store.getItem("lb_shelters") || "[]");
      const newShelter = { id: "s-" + Math.random().toString(36).substring(4), ...body };
      shelters.push(newShelter);
      store.setItem("lb_shelters", JSON.stringify(shelters));
      return newShelter;
    }
  }
  if (endpoint.startsWith("/shelters/") && method === "PATCH") {
    const shId = endpoint.split("/").pop();
    const body = JSON.parse(options.body as string);
    const shelters = JSON.parse(store.getItem("lb_shelters") || "[]");
    const idx = shelters.findIndex((s: any) => s.id === shId);
    if (idx > -1) {
      shelters[idx] = { ...shelters[idx], ...body };
      store.setItem("lb_shelters", JSON.stringify(shelters));
      return shelters[idx];
    }
    throw new Error("Shelter not found");
  }

  // Hospitals
  if (endpoint === "/hospitals") {
    if (method === "GET") {
      return JSON.parse(store.getItem("lb_hospitals") || "[]");
    }
    if (method === "POST") {
      const body = JSON.parse(options.body as string);
      const hospitals = JSON.parse(store.getItem("lb_hospitals") || "[]");
      const newHospital = { id: "h-" + Math.random().toString(36).substring(4), ...body };
      hospitals.push(newHospital);
      store.setItem("lb_hospitals", JSON.stringify(hospitals));
      return newHospital;
    }
  }
  if (endpoint.startsWith("/hospitals/") && method === "PATCH") {
    const hospId = endpoint.split("/").pop();
    const body = JSON.parse(options.body as string);
    const hospitals = JSON.parse(store.getItem("lb_hospitals") || "[]");
    const idx = hospitals.findIndex((h: any) => h.id === hospId);
    if (idx > -1) {
      hospitals[idx] = { ...hospitals[idx], ...body };
      store.setItem("lb_hospitals", JSON.stringify(hospitals));
      return hospitals[idx];
    }
    throw new Error("Hospital not found");
  }

  // Volunteers
  if (endpoint === "/volunteers") {
    if (method === "GET") {
      return JSON.parse(store.getItem("lb_volunteers") || "[]");
    }
    if (method === "POST") {
      const body = JSON.parse(options.body as string);
      const user = JSON.parse(store.getItem("lb_user") || "{}");
      const volunteers = JSON.parse(store.getItem("lb_volunteers") || "[]");
      const newVol = {
        id: "v-" + Math.random().toString(36).substring(4),
        user_id: user.id,
        user: { name: user.name, email: user.email },
        skill_set: body.skill_set,
        status: body.status || "active",
        current_lat: user.latitude || 40.7128,
        current_lng: user.longitude || -74.0060
      };
      volunteers.push(newVol);
      store.setItem("lb_volunteers", JSON.stringify(volunteers));
      return newVol;
    }
  }
  if (endpoint === "/volunteers/me" && method === "PUT") {
    const body = JSON.parse(options.body as string);
    const user = JSON.parse(store.getItem("lb_user") || "{}");
    const volunteers = JSON.parse(store.getItem("lb_volunteers") || "[]");
    const idx = volunteers.findIndex((v: any) => v.user_id === user.id);
    if (idx > -1) {
      volunteers[idx] = { ...volunteers[idx], ...body };
      store.setItem("lb_volunteers", JSON.stringify(volunteers));
      return volunteers[idx];
    }
    throw new Error("Volunteer profile not found");
  }

  // Resources
  if (endpoint === "/resources") {
    if (method === "GET") {
      return JSON.parse(store.getItem("lb_resources") || "[]");
    }
    if (method === "POST") {
      const body = JSON.parse(options.body as string);
      const resources = JSON.parse(store.getItem("lb_resources") || "[]");
      const newRes = { id: "rs-" + Math.random().toString(36).substring(4), ...body };
      resources.push(newRes);
      store.setItem("lb_resources", JSON.stringify(resources));
      return newRes;
    }
  }
  if (endpoint.startsWith("/resources/") && method === "PATCH") {
    const resId = endpoint.split("/").pop();
    const body = JSON.parse(options.body as string);
    const resources = JSON.parse(store.getItem("lb_resources") || "[]");
    const idx = resources.findIndex((r: any) => r.id === resId);
    if (idx > -1) {
      resources[idx] = { ...resources[idx], ...body };
      store.setItem("lb_resources", JSON.stringify(resources));
      return resources[idx];
    }
    throw new Error("Resource not found");
  }

  // Notifications
  if (endpoint === "/notifications" && method === "GET") {
    return JSON.parse(store.getItem("lb_notifications") || "[]");
  }
  if (endpoint === "/notifications/broadcast" && method === "POST") {
    const body = JSON.parse(options.body as string);
    const notifs = JSON.parse(store.getItem("lb_notifications") || "[]");
    const newBroadcast = {
      id: "n-" + Math.random().toString(36).substring(4),
      user_id: null,
      is_read: false,
      created_at: new Date().toISOString(),
      ...body
    };
    notifs.unshift(newBroadcast);
    store.setItem("lb_notifications", JSON.stringify(notifs));
    return newBroadcast;
  }
  if (endpoint.startsWith("/notifications/") && endpoint.endsWith("/read") && method === "POST") {
    const nId = endpoint.split("/")[2];
    const notifs = JSON.parse(store.getItem("lb_notifications") || "[]");
    const idx = notifs.findIndex((n: any) => n.id === nId);
    if (idx > -1) {
      notifs[idx].is_read = true;
      store.setItem("lb_notifications", JSON.stringify(notifs));
      return notifs[idx];
    }
    throw new Error("Notification not found");
  }

  // AI Chat Copilot
  if (endpoint === "/ai/chat" && method === "POST") {
    const body = JSON.parse(options.body as string);
    const msg = body.message.toLowerCase();
    const lang = body.preferred_language || "English";
    
    let reply = "I am the LifeBridge AI Assistant. I have analyzed your query and can help you with emergency coordination, first aid guidelines, and finding safe routes.";
    let emergency_assessment = {
      disaster_type: "none",
      severity: "low",
      priority: "low",
      injuries_mentioned: false,
      vulnerable_present: false,
      recommended_actions: ["Assess surroundings", "Ensure personal safety", "Contact emergency services"],
      confidence_score: 0.8
    };
    let routing = {
      route_found: false,
      start_location: "",
      destination: "",
      steps: [] as any[],
      hazards_avoided: [] as string[]
    };
    let matched_shelters = {
      facilities_found: false,
      recommendations: [] as any[],
      rationale: "No active query for shelters."
    };
    let first_aid_guidance = {
      guidelines_provided: false,
      emergency_type: "",
      steps: [] as any[],
      disclaimer: "",
      never_diagnose_warning: ""
    };
    let alerts_feed = {
      alerts_found: false,
      active_alerts: [] as any[]
    };

    if (msg.includes("flood") || msg.includes("water") || msg.includes("evacuate")) {
      reply = "CRITICAL WARNING: Active flooding detected near you. You should evacuate to the high ground immediately. A safe route avoiding blocked roads has been calculated to the Community Safe Haven - West Wing shelter.";
      emergency_assessment = {
        disaster_type: "flood",
        severity: "critical",
        priority: "critical",
        injuries_mentioned: false,
        vulnerable_present: true,
        recommended_actions: [
          "Evacuate to high ground immediately.",
          "Avoid walking or driving through moving floodwaters.",
          "Disconnect utilities and secure your home."
        ],
        confidence_score: 0.98
      };
      matched_shelters = {
        facilities_found: true,
        recommendations: [
          {
            id: "s1",
            name: "Community Safe Haven - West Wing",
            type: "shelter",
            distance_km: 0.85,
            capacity_status: "available",
            contact_info: "+1 (555) 123-4567",
            occupancy_or_beds: "45 / 250 occupancy"
          }
        ],
        rationale: "Matched closest shelter with available capacity."
      };
      routing = {
        route_found: true,
        start_location: "Current Location",
        destination: "Community Safe Haven - West Wing",
        steps: [
          { instruction: "Head north on Resilience Blvd", latitude: 40.7128, longitude: -74.0060 },
          { instruction: "Turn right onto Safe Ridge Road, avoiding flooded Main Street", latitude: 40.7145, longitude: -74.0035 },
          { instruction: "Continue 300m to arrive at the Shelter", latitude: 40.7128, longitude: -74.0060 }
        ],
        hazards_avoided: ["Main Street active flooding roadblock"]
      };
      alerts_feed = {
        alerts_found: true,
        active_alerts: [
          {
            title: "🔴 Flash Flood Warning - Evacuation Advised",
            severity: "critical",
            summary: "High-risk flooding expected in low-lying coastal areas. Emergency teams are active.",
            instructions: "Evacuate to nearest shelter immediately.",
            active: true
          }
        ]
      };
    } else if (msg.includes("cpr") || msg.includes("bleed") || msg.includes("burn") || msg.includes("snake") || msg.includes("bite") || msg.includes("first aid")) {
      reply = "Medical Emergency First Aid instructions generated. Apply direct pressure for bleeding, or place hands on center of chest for CPR chest compressions. Call emergency services immediately.";
      emergency_assessment = {
        disaster_type: "medical",
        severity: "high",
        priority: "high",
        injuries_mentioned: true,
        vulnerable_present: false,
        recommended_actions: ["Initiate first aid procedures", "Prepare area for responders", "Keep the victim warm and calm"],
        confidence_score: 0.95
      };
      first_aid_guidance = {
        guidelines_provided: true,
        emergency_type: msg.includes("snake") ? "Snake bites" : msg.includes("cpr") ? "CPR" : msg.includes("burn") ? "Burns" : "Bleeding",
        steps: msg.includes("snake") ? [
          { step_number: 1, action: "Keep calm and immobile", details: "Minimize movement to slow venom spread. Keep bitten limb below heart level." },
          { step_number: 2, action: "Clean the bite wound", details: "Wash gently with soap and water. Remove rings or tight clothing as swelling will occur." },
          { step_number: 3, action: "Do NOT cut or suck venom", details: "Never cut the wound or try to suck venom out. Walk slowly if necessary; call emergency." }
        ] : msg.includes("cpr") ? [
          { step_number: 1, action: "Check responsiveness", details: "Tap shoulder and shout loudly. Check for breathing." },
          { step_number: 2, action: "Start compressions", details: "Push hard and fast in center of chest: 2 inches deep, 100-120 compressions per minute." },
          { step_number: 3, action: "Give rescue breaths (if trained)", details: "Give 2 rescue breaths after every 30 compressions." }
        ] : [
          { step_number: 1, action: "Apply direct pressure", details: "Press firmly on the wound with clean cloth or bandage." },
          { step_number: 2, action: "Elevate wound site", details: "Raise the bleeding limb above heart level if possible." },
          { step_number: 3, action: "Add bandage layer", details: "Do not remove original dressing; wrap firmly with more layers." }
        ],
        disclaimer: "CRITICAL: This guide is for temporary stabilization. Contact medical emergency services (112 / 108 / 911) immediately.",
        never_diagnose_warning: "Warning: Do not attempt to diagnose underlying medical conditions or administer prescriptions."
      };
    }

    if (lang !== "English") {
      reply = `[${lang} Translation]: ${reply}`;
    }

    return {
      message: reply,
      preferred_language: lang,
      emergency_assessment,
      routing,
      matched_shelters,
      first_aid_guidance,
      alerts_feed
    };
  }

  // Multimodal image analysis fallback
  if (endpoint === "/ai/analyze-image" && method === "POST") {
    const fd = options.body as FormData;
    const file = fd?.get("file") as any;
    const name = file ? file.name.toLowerCase() : "default.png";
    
    let res = {
      floods_detected: false,
      fire_detected: false,
      damage_detected: false,
      roadblock_detected: false,
      injuries_detected: false,
      hazard_summary: "Simulated Image Analysis: Low level of hazards detected.",
      estimated_severity: "low",
      suggested_safety_actions: [
        "Monitor local government advisories",
        "Keep emergency contacts notified"
      ]
    };
    
    if (name.includes("flood") || name.includes("water")) {
      res = {
        floods_detected: true,
        fire_detected: false,
        damage_detected: false,
        roadblock_detected: false,
        injuries_detected: false,
        hazard_summary: "Critical floodwaters and street submergence observed in coordinates sector.",
        estimated_severity: "critical",
        suggested_safety_actions: ["Relocate to safe shelter", "Avoid crossing low bridges", "Do not walk or drive in moving flood waters"]
      };
    } else if (name.includes("fire") || name.includes("smoke")) {
      res = {
        floods_detected: false,
        fire_detected: true,
        damage_detected: false,
        roadblock_detected: false,
        injuries_detected: false,
        hazard_summary: "Active building fire with intense heat emission and smoke columns.",
        estimated_severity: "critical",
        suggested_safety_actions: ["Evacuate the area immediately", "Call local fire fighters", "Stay low to ground"]
      };
    } else if (name.includes("damage") || name.includes("ruin")) {
      res = {
        floods_detected: false,
        fire_detected: false,
        damage_detected: true,
        roadblock_detected: false,
        injuries_detected: false,
        hazard_summary: "Widespread rubble and partial building collapse detected in masonry structures.",
        estimated_severity: "high",
        suggested_safety_actions: ["Avoid damaged concrete structures", "Wear protective headgear", "Keep away from power lines"]
      };
    } else if (name.includes("road") || name.includes("block")) {
      res = {
        floods_detected: false,
        fire_detected: false,
        damage_detected: false,
        roadblock_detected: true,
        injuries_detected: false,
        hazard_summary: "Blocked road due to debris, mudslide, or high waters.",
        estimated_severity: "medium",
        suggested_safety_actions: ["Navigate via safe alternative roads", "Alert volunteer rescue details"]
      };
    } else if (name.includes("injury") || name.includes("wound") || name.includes("hurt")) {
      res = {
        floods_detected: false,
        fire_detected: false,
        damage_detected: false,
        roadblock_detected: false,
        injuries_detected: true,
        hazard_summary: "Visible injury detected. Prompt medical care recommended.",
        estimated_severity: "high",
        suggested_safety_actions: ["Apply direct pressure to limit blood loss", "Comfort patient", "Call paramedic responders"]
      };
    }
    return res;
  }

  // Admin stats fallback
  if (endpoint === "/admin/stats" && method === "GET") {
    const shelters = JSON.parse(store.getItem("lb_shelters") || "[]");
    const hospitals = JSON.parse(store.getItem("lb_hospitals") || "[]");
    const resources = JSON.parse(store.getItem("lb_resources") || "[]");
    const volunteers = JSON.parse(store.getItem("lb_volunteers") || "[]");
    const requests = JSON.parse(store.getItem("lb_requests") || "[]");

    const status_counts: any = { pending: 0, dispatched: 0, resolved: 0, cancelled: 0 };
    const type_counts: any = { flood: 0, earthquake: 0, fire: 0, cyclone: 0, landslide: 0, medical: 0, other: 0 };
    
    requests.forEach((r: any) => {
      if (status_counts[r.status] !== undefined) status_counts[r.status]++;
      if (type_counts[r.emergency_type] !== undefined) type_counts[r.emergency_type]++;
    });

    const total_capacity = shelters.reduce((acc: number, s: any) => acc + s.capacity, 0) || 100;
    const total_occupancy = shelters.reduce((acc: number, s: any) => acc + s.current_occupancy, 0) || 0;
    
    const total_beds = hospitals.reduce((acc: number, h: any) => acc + h.total_beds, 0) || 100;
    const avail_beds = hospitals.reduce((acc: number, h: any) => acc + h.available_beds, 0) || 0;

    const inventory = resources.map((r: any) => ({
      name: r.name,
      type: r.type,
      quantity: r.quantity,
      status: r.status
    }));

    return {
      requests_by_status: status_counts,
      requests_by_type: type_counts,
      total_requests: requests.length,
      volunteers_active: volunteers.length,
      volunteers_total: volunteers.length,
      shelters: {
        total_capacity,
        total_occupancy,
        occupancy_rate: total_capacity > 0 ? Math.round((total_occupancy / total_capacity) * 100) : 0
      },
      hospitals: {
        total_beds,
        available_beds: avail_beds,
        utilization_rate: total_beds > 0 ? Math.round(((total_beds - avail_beds) / total_beds) * 100) : 0
      },
      inventory,
      incident_trends: [
        { day: "Mon", incidents: 4 },
        { day: "Tue", incidents: 7 },
        { day: "Wed", incidents: 15 },
        { day: "Thu", incidents: 11 },
        { day: "Fri", incidents: 6 },
        { day: "Sat", incidents: 8 },
        { day: "Sun", incidents: 5 }
      ],
      average_response_time_min: 4.8
    };
  }

  if (endpoint === "/admin/audit-logs" && method === "GET") {
    const requests = JSON.parse(store.getItem("lb_requests") || "[]");
    const logs = [
      { id: "log-1", user_id: "mock-uid", action: "USER_REGISTER", details: "Registered new user: jane@lifebridge.ai (Role: citizen)", created_at: new Date(Date.now() - 3600000 * 3).toISOString() },
      { id: "log-2", user_id: "mock-uid", action: "USER_REGISTER", details: "Registered new user: rescue_admin@lifebridge.ai (Role: admin)", created_at: new Date(Date.now() - 3600000 * 2).toISOString() },
      { id: "log-3", user_id: "mock-uid", action: "SHELTER_UPDATE", details: "Shelter occupancy updated: 45/250 beds reserved.", created_at: new Date(Date.now() - 3600000 * 1.5).toISOString() }
    ];

    requests.forEach((r: any, idx: number) => {
      logs.push({
        id: `log-req-${idx}`,
        user_id: r.user_id,
        action: "SOS_DISPATCH",
        details: `SOS Distress request created (Type: ${r.emergency_type}, Severity: ${r.severity})`,
        created_at: r.created_at
      });
    });

    return logs.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  return null;
}

export const api = {
  // Auth
  async register(data: any) {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async login(credentials: any) {
    return request("/auth/login/json", {
      method: "POST",
      body: JSON.stringify(credentials),
    });
  },
  async getMe() {
    return request("/auth/me");
  },
  logout() {
    getStorage()?.removeItem("lb_token");
    getStorage()?.removeItem("lb_user");
  },

  // Users profile & contacts
  async updateProfile(data: any) {
    return request("/users/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },
  async getContacts() {
    return request("/users/me/contacts");
  },
  async addContact(data: any) {
    return request("/users/me/contacts", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async deleteContact(id: string) {
    return request(`/users/me/contacts/${id}`, {
      method: "DELETE",
    });
  },

  // Emergency Requests
  async createRequest(data: any) {
    return request("/requests", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async getRequests() {
    return request("/requests");
  },
  async getMyRequests() {
    return request("/requests/me");
  },
  async updateRequestStatus(id: string, status: string) {
    return request(`/requests/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
  },

  // Shelters
  async getShelters() {
    return request("/shelters");
  },
  async createShelter(data: any) {
    return request("/shelters", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async updateShelterOccupancy(id: string, occupancy: number) {
    return request(`/shelters/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ current_occupancy: occupancy }),
    });
  },

  // Hospitals
  async getHospitals() {
    return request("/hospitals");
  },
  async createHospital(data: any) {
    return request("/hospitals", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async updateHospitalBeds(id: string, available: number) {
    return request(`/hospitals/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ available_beds: available }),
    });
  },

  // Volunteers
  async getVolunteers() {
    return request("/volunteers");
  },
  async registerVolunteer(data: any) {
    return request("/volunteers", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async updateVolunteerStatus(data: any) {
    return request("/volunteers/me", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  },

  // Resources
  async getResources() {
    return request("/resources");
  },
  async createResource(data: any) {
    return request("/resources", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async updateResourceQty(id: string, qty: number, status?: string) {
    return request(`/resources/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ quantity: qty, ...(status ? { status } : {}) }),
    });
  },

  // Notifications
  async getNotifications() {
    return request("/notifications");
  },
  async broadcastAlert(data: any) {
    return request("/notifications/broadcast", {
      method: "POST",
      body: JSON.stringify(data),
    });
  },
  async markNotificationRead(id: string) {
    return request(`/notifications/${id}/read`, {
      method: "POST",
    });
  },

  // AI Chat Copilot API call
  async sendChatMessage(message: string, lat?: number, lng?: number, preferredLanguage?: string) {
    return request("/ai/chat", {
      method: "POST",
      body: JSON.stringify({ message, latitude: lat, longitude: lng, preferred_language: preferredLanguage }),
    });
  },

  async analyzeImage(file: File) {
    const formData = new FormData();
    formData.append("file", file);
    return request("/ai/analyze-image", {
      method: "POST",
      body: formData,
    });
  },

  async syncOfflineRequests() {
    const store = getStorage();
    if (!store) return { synced: 0, failed: 0 };
    const queue = JSON.parse(store.getItem("lb_offline_requests") || "[]");
    if (queue.length === 0) return { synced: 0, failed: 0 };
    
    console.log(`Syncing ${queue.length} offline requests...`);
    let synced = 0;
    let failed = 0;
    const remaining = [];
    
    for (const req of queue) {
      try {
        await fetch(`${BASE_URL}${req.endpoint}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(store.getItem("lb_token") ? { Authorization: `Bearer ${store.getItem("lb_token")}` } : {})
          },
          body: JSON.stringify(req.body)
        });
        synced++;
      } catch (err) {
        console.error("Failed to sync offline request:", err);
        failed++;
        remaining.push(req);
      }
    }
    store.setItem("lb_offline_requests", JSON.stringify(remaining));
    return { synced, failed };
  },

  async getAdminStats() {
    return request("/admin/stats");
  },

  async getAuditLogs() {
    return request("/admin/audit-logs");
  }
};
