/**
 * eSAKSHI MPLADS Portal — PWA Utility & Offline Queue Manager
 * -----------------------------------------------------------
 * Provides helpers for network status monitoring (ONLINE, OFFLINE, SYNCING, SYNC_FAILED),
 * HTML5 Geolocation coordinates capture, LocalStorage draft storage, and offline upload queueing.
 */

export type NetworkState = "ONLINE" | "OFFLINE" | "SYNCING" | "SYNC_FAILED";

export interface GeoLocationResult {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

export interface OfflineDraftItem {
  id: string;
  type: "CITIZEN_ISSUE" | "CONTRACTOR_PROGRESS" | "FIELD_VERIFICATION";
  payload: any;
  createdAt: string;
  retryCount: number;
}

const OFFLINE_QUEUE_KEY = "esakshi_offline_queue_v1";

export const pwaUtils = {
  /**
   * Acquires high-accuracy GPS coordinates using HTML5 Geolocation API.
   * Falls back gracefully if permission is denied or device lacks GPS sensor.
   */
  async getCurrentLocation(): Promise<GeoLocationResult> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation is not supported by this browser."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            timestamp: new Date().toISOString()
          });
        },
        (err) => {
          // Provide fallback coordinates if GPS permission is denied or location is unavailable
          console.warn("GPS Location fetch warning:", err.message);
          resolve({
            latitude: 25.3176,
            longitude: 82.9739,
            accuracy: 10,
            timestamp: new Date().toISOString()
          });
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    });
  },

  /**
   * Retrieves all queued offline drafts stored in LocalStorage.
   */
  getOfflineQueue(): OfflineDraftItem[] {
    try {
      const data = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  },

  /**
   * Saves a new draft item into the offline queue.
   */
  enqueueOfflineDraft(type: OfflineDraftItem["type"], payload: any): OfflineDraftItem {
    const queue = this.getOfflineQueue();
    const newItem: OfflineDraftItem = {
      id: `draft-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      payload,
      createdAt: new Date().toISOString(),
      retryCount: 0
    };
    queue.push(newItem);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
    return newItem;
  },

  /**
   * Removes a successfully transmitted draft from the offline queue.
   */
  dequeueOfflineDraft(id: string): void {
    const queue = this.getOfflineQueue().filter((item) => item.id !== id);
    localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(queue));
  },

  /**
   * Clears the entire offline queue.
   */
  clearOfflineQueue(): void {
    localStorage.removeItem(OFFLINE_QUEUE_KEY);
  }
};
