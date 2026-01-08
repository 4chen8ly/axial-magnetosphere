using UnityEngine;
using System.Collections;
using System.Text;
using UnityEngine.Networking;

// Mock response structure
[System.Serializable]
public class GeminiResponse
{
    public string content;
}

public class ClueInspector : MonoBehaviour
{
    [Header("Settings")]
    public string geminiApiKey = "YOUR_API_KEY"; // Placeholder
    public string modelName = "gemini-3-flash";
    
    [Header("Player State")]
    public int playerSkillLevel = 1; // 1 = Novice, 5 = Master Hacker

    [Header("UI References")]
    // References to UI Text components would go here in a real Unity project
    // public TMPro.TMP_Text descriptionText;

    private const string API_URL = "https://generativelanguage.googleapis.com/v1beta/models/{0}:generateContent?key={1}";

    /// <summary>
    /// Called when the player clicks the Flipper Zero item.
    /// </summary>
    public void OnInspectFlipperZero()
    {
        Debug.Log($"[ClueInspector] Inspecting Flipper Zero. Skill Level: {playerSkillLevel}");
        StartCoroutine(FetchClueDescriptionCoroutine("flipper_zero_2026", "A Flipper Zero device found in the bio-waste chute."));
    }

    private IEnumerator FetchClueDescriptionCoroutine(string clueId, string baseContext)
    {
        // Construct the prompt based on skill level
        string prompt = ConstructPrompt(clueId, baseContext);
        
        // JSON payload for Gemini API
        string jsonPayload = $"{{\"contents\":[{{\"parts\":[{{\"text\":\"{prompt}\"}}]}}]}}";

        string url = string.Format(API_URL, modelName, geminiApiKey);

        using (UnityWebRequest request = new UnityWebRequest(url, "POST"))
        {
            byte[] bodyRaw = Encoding.UTF8.GetBytes(jsonPayload);
            request.uploadHandler = new UploadHandlerRaw(bodyRaw);
            request.downloadHandler = new DownloadHandlerBuffer();
            request.SetRequestHeader("Content-Type", "application/json");

            Debug.Log("[ClueInspector] Sending request to Gemini...");
            
            // In a real scenario, we send the request. 
            // For this non-Unity environment, we will mock the completion.
            // yield return request.SendWebRequest();
            yield return new WaitForSeconds(0.5f); // Simulate network delay

            if (false) // request.result != UnityWebRequest.Result.Success
            {
                Debug.LogError($"[ClueInspector] API Error: {request.error}");
            }
            else
            {
                // Simulate a successful response based on the Master Truth File
                string mockResponse = MockGeminiResponse(clueId);
                Debug.Log($"[ClueInspector] Received Description:\n{mockResponse}");
                
                // Update UI here
                // descriptionText.text = mockResponse;
            }
        }
    }

    private string ConstructPrompt(string clueId, string baseContext)
    {
        string systemInstruction = "You are the Logic Engine for a detective game. Describe the object based on the user's skill level.";
        string skillModifier = "";

        if (playerSkillLevel < 3)
            skillModifier = "Describe superficial details only. The user doesn't understand the tech.";
        else
            skillModifier = "Reveal hidden technical logs, frequency 2.4GHz matches, and timestamp metadata.";

        return $"{systemInstruction} Object: {baseContext}. Skill Level: {playerSkillLevel}. Instruction: {skillModifier}";
    }

    private string MockGeminiResponse(string clueId)
    {
        // Hardcoded Truth for prototype verification
        if (clueId == "flipper_zero_2026")
        {
            if (playerSkillLevel < 3)
            {
                return "It's a small, toy-like device with a dolphin logo. Screen is cracked but functional. Looks like some kind of remote.";
            }
            else
            {
                return "Analysis Complete: Firmware dump reveals a recent 2.4GHz signal injection log. Timestamp: 22:14:05. Target Protocol: Ocular_Implant_v4. This device was used to trigger the feedback loop.";
            }
        }
        return "Analysis inconclusive.";
    }
}
