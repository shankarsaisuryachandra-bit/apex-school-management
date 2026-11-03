package com.sms.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@Slf4j
public class AiStudyService {

    @Value("${app.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${app.gemini.model:gemini-1.5-flash}")
    private String geminiModel;

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    public Map<String, Object> chat(String prompt, String subject) {
        return chat(prompt, subject, null);
    }

    /**
     * AI Academic Study Tutor — answers student doubts with step-by-step reasoning.
     * Tier 1: Google Gemini API (if key provided in request or environment).
     * Tier 2: Dynamic Real-time Math & Algebraic Computation Engine.
     * Tier 3: Live Wikipedia Knowledge Retrieval Engine.
     * Tier 4: Curriculum Knowledge Repository & Transparent Subject Analysis.
     */
    public Map<String, Object> chat(String prompt, String subject, String clientApiKey) {
        String safePrompt = prompt != null ? prompt.trim() : "Hello";
        String safeSubject = subject != null && !subject.isBlank() ? subject.trim() : "General Science";

        String answer = null;
        String source = "BUILTIN_ACADEMIC_ENGINE";

        // 1. TIER 1: Try Gemini Generative AI if an API key is available
        String effectiveKey = resolveApiKey(clientApiKey);
        if (effectiveKey != null && !effectiveKey.isBlank()) {
            try {
                answer = callGeminiApi(safePrompt, safeSubject, effectiveKey);
                if (answer != null && !answer.isBlank()) {
                    source = "GOOGLE_GEMINI_AI";
                }
            } catch (Exception ex) {
                log.warn("Gemini API call failed, falling back to dynamic computation: {}", ex.getMessage());
            }
        }

        // 2. TIER 2: Try Dynamic Mathematical & Algebraic Problem Solver
        if (answer == null || answer.isBlank()) {
            String mathSolution = solveMathematicalQuery(safePrompt);
            if (mathSolution != null) {
                answer = mathSolution;
                source = "DYNAMIC_MATHEMATICAL_ENGINE";
            }
        }

        // 3. TIER 3: Try Live Encyclopedic Knowledge Retrieval (Wikipedia REST API)
        if (answer == null || answer.isBlank()) {
            String wikiAnswer = fetchWikipediaKnowledge(safePrompt, safeSubject);
            if (wikiAnswer != null) {
                answer = wikiAnswer;
                source = "WIKIPEDIA_KNOWLEDGE_ENGINE";
            }
        }

        // 4. TIER 4: Target Curriculum Knowledge Repository / Direct Subject Analysis
        if (answer == null || answer.isBlank()) {
            answer = generatePedagogicalResponse(safePrompt, safeSubject);
            source = "CURRICULUM_PEDAGOGICAL_ENGINE";
        }

        Map<String, Object> response = new HashMap<>();
        response.put("answer", answer);
        response.put("subject", safeSubject);
        response.put("source", source);
        response.put("timestamp", java.time.LocalDateTime.now().toString());
        return response;
    }

    public List<Map<String, Object>> generateQuiz(String subject, String topic, int count) {
        return generateQuiz(subject, topic, count, null);
    }

    /**
     * AI Interactive Quiz Generator — generates curriculum MCQs with explanations.
     */
    public List<Map<String, Object>> generateQuiz(String subject, String topic, int count, String clientApiKey) {
        String safeSubject = subject != null && !subject.isBlank() ? subject.trim() : "Mathematics";
        String safeTopic = topic != null && !topic.isBlank() ? topic.trim() : "Core Concepts";
        int safeCount = count > 0 && count <= 10 ? count : 4;

        String effectiveKey = resolveApiKey(clientApiKey);
        if (effectiveKey != null && !effectiveKey.isBlank()) {
            try {
                List<Map<String, Object>> geminiQuestions = callGeminiQuizApi(safeSubject, safeTopic, safeCount, effectiveKey);
                if (geminiQuestions != null && !geminiQuestions.isEmpty()) {
                    return geminiQuestions;
                }
            } catch (Exception ex) {
                log.warn("Gemini Quiz API call failed, using curriculum quiz bank: {}", ex.getMessage());
            }
        }

        return getCurriculumQuizQuestions(safeSubject, safeTopic, safeCount);
    }

    public Map<String, Object> generateWorksheet(String subject, String topic, String gradeLevel) {
        return generateWorksheet(subject, topic, gradeLevel, null);
    }

    /**
     * AI Assignment / Worksheet Generator for Faculty.
     */
    public Map<String, Object> generateWorksheet(String subject, String topic, String gradeLevel, String clientApiKey) {
        String safeSubject = subject != null && !subject.isBlank() ? subject.trim() : "Mathematics";
        String safeTopic = topic != null && !topic.isBlank() ? topic.trim() : "General Revision";
        String safeGrade = gradeLevel != null && !gradeLevel.isBlank() ? gradeLevel.trim() : "Class 10";

        String effectiveKey = resolveApiKey(clientApiKey);
        if (effectiveKey != null && !effectiveKey.isBlank()) {
            try {
                Map<String, Object> geminiWorksheet = callGeminiWorksheetApi(safeSubject, safeTopic, safeGrade, effectiveKey);
                if (geminiWorksheet != null && !geminiWorksheet.isEmpty()) {
                    return geminiWorksheet;
                }
            } catch (Exception ex) {
                log.warn("Gemini Worksheet API call failed, generating pedagogical worksheet: {}", ex.getMessage());
            }
        }

        Map<String, Object> worksheet = new HashMap<>();
        worksheet.put("title", String.format("%s: %s Problem Set & Worksheet", safeGrade, safeTopic));
        worksheet.put("subject", safeSubject);
        worksheet.put("maxMarks", 50);

        String instructions = "Solve all questions neatly in your coursework notebook or submit a clear scanned PDF solution. " +
                "Show all step-by-step calculations, governing laws, and intermediate formulas. Due within 7 calendar days.";
        worksheet.put("instructions", instructions);

        List<String> questions = generateWorksheetQuestions(safeSubject, safeTopic);
        worksheet.put("questions", questions);

        worksheet.put("rubric", "Section A (Short Questions - 10 Marks), Section B (Calculations & Proofs - 25 Marks), Section C (Analytical & Application Problem - 15 Marks). Total = 50 Marks.");
        worksheet.put("generatedAt", java.time.LocalDateTime.now().toString());
        return worksheet;
    }

    // ──────────────────────────── API KEY RESOLVER ────────────────────────────

    private String resolveApiKey(String clientKey) {
        if (clientKey != null && !clientKey.isBlank()) {
            return clientKey.trim();
        }
        if (geminiApiKey != null && !geminiApiKey.isBlank()) {
            return geminiApiKey.trim();
        }
        String envKey = System.getenv("GEMINI_API_KEY");
        if (envKey != null && !envKey.isBlank()) {
            return envKey.trim();
        }
        return null;
    }

    // ──────────────────────────── GEMINI API CLIENT ────────────────────────────

    private String callGeminiApi(String prompt, String subject, String apiKey) throws Exception {
        String endpoint = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                geminiModel != null ? geminiModel : "gemini-1.5-flash",
                apiKey
        );

        String systemInstruction = "You are an expert CBSE/ICSE academic tutor. " +
                "CRITICAL INSTRUCTION: Answer the student's exact question directly and accurately. " +
                "Do NOT provide generic preambles or unrelated canned lectures. " +
                "If asked for a calculation, provide the exact calculation and step-by-step solution first. " +
                "If asked for a concept or definition, define and explain that specific concept with clean markdown. " +
                "Subject context: " + subject;

        Map<String, Object> part = Map.of("text", systemInstruction + "\n\nStudent Question: " + prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> requestBodyMap = Map.of("contents", List.of(content));

        String jsonBody = objectMapper.writeValueAsString(requestBodyMap);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(12))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                JsonNode parts = candidates.get(0).path("content").path("parts");
                if (parts.isArray() && !parts.isEmpty()) {
                    return parts.get(0).path("text").asText();
                }
            }
        }
        log.warn("Gemini API non-200 response: status={}, body={}", response.statusCode(), response.body());
        return null;
    }

    private List<Map<String, Object>> callGeminiQuizApi(String subject, String topic, int count, String apiKey) throws Exception {
        String endpoint = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                geminiModel != null ? geminiModel : "gemini-1.5-flash",
                apiKey
        );

        String prompt = String.format(
                "Generate exactly %d multiple-choice practice questions (MCQs) for high school %s on the topic '%s'. " +
                "Return ONLY a raw JSON array of objects with keys: " +
                "id (integer), question (string), options (array of 4 strings with letters A, B, C, D), correctIndex (0-3 integer), explanation (string), subject (string), topic (string). " +
                "No markdown backticks, no text outside the JSON array.",
                count, subject, topic
        );

        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> requestBodyMap = Map.of("contents", List.of(content));

        String jsonBody = objectMapper.writeValueAsString(requestBodyMap);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(15))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                String text = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
                text = text.replaceAll("```json", "").replaceAll("```", "").trim();
                return objectMapper.readValue(text, List.class);
            }
        }
        return null;
    }

    private Map<String, Object> callGeminiWorksheetApi(String subject, String topic, String gradeLevel, String apiKey) throws Exception {
        String endpoint = String.format(
                "https://generativelanguage.googleapis.com/v1beta/models/%s:generateContent?key=%s",
                geminiModel != null ? geminiModel : "gemini-1.5-flash",
                apiKey
        );

        String prompt = String.format(
                "Generate a structured homework worksheet for %s on the topic '%s' for %s. " +
                "Return ONLY a raw JSON object with keys: " +
                "title (string), subject (string), maxMarks (integer, usually 50), instructions (string), questions (array of 5 strings with marks), rubric (string). " +
                "No markdown backticks, no extra text.",
                subject, topic, gradeLevel
        );

        Map<String, Object> part = Map.of("text", prompt);
        Map<String, Object> content = Map.of("parts", List.of(part));
        Map<String, Object> requestBodyMap = Map.of("contents", List.of(content));

        String jsonBody = objectMapper.writeValueAsString(requestBodyMap);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(endpoint))
                .header("Content-Type", "application/json")
                .timeout(Duration.ofSeconds(15))
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 200) {
            JsonNode root = objectMapper.readTree(response.body());
            JsonNode candidates = root.path("candidates");
            if (candidates.isArray() && !candidates.isEmpty()) {
                String text = candidates.get(0).path("content").path("parts").get(0).path("text").asText();
                text = text.replaceAll("```json", "").replaceAll("```", "").trim();
                return objectMapper.readValue(text, Map.class);
            }
        }
        return null;
    }

    // ──────────────────────────── DYNAMIC MATHEMATICAL ENGINE ────────────────────────────

    /**
     * Solves arithmetic, percentages, square roots, and algebraic equations directly from the user's prompt.
     */
    private String solveMathematicalQuery(String rawPrompt) {
        String p = rawPrompt.trim();

        // 1. Percentage: "20% of 1500" or "what is 25 percent of 800"
        Pattern pctPat = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*(?:%|percent)\\s+of\\s+(\\d+(?:\\.\\d+)?)", Pattern.CASE_INSENSITIVE);
        Matcher pctMat = pctPat.matcher(p);
        if (pctMat.find()) {
            double pct = Double.parseDouble(pctMat.group(1));
            double total = Double.parseDouble(pctMat.group(2));
            double result = (pct / 100.0) * total;
            String resStr = result == (long) result ? String.valueOf((long) result) : String.format("%.2f", result);
            return String.format(
                    "### 🧮 Mathematical Solution: Percentage Calculation\n\n" +
                    "**Question:** What is %s%% of %s?\n\n" +
                    "#### Step-by-Step Working:\n" +
                    "1. Express percentage as a fraction: $\\frac{%s}{100}$\n" +
                    "2. Multiply by the base amount: $\\frac{%s}{100} \\times %s$\n" +
                    "3. Compute: $%.4f \\times %s = %s$\n\n" +
                    "**🎯 Final Answer: `%s`**",
                    pctMat.group(1), pctMat.group(2), pctMat.group(1), pctMat.group(1), pctMat.group(2), (pct / 100.0), pctMat.group(2), resStr, resStr
            );
        }

        // 2. Square Root: "sqrt(144)" or "square root of 144"
        Pattern sqrtPat = Pattern.compile("(?:sqrt\\(|square root of\\s*)(\\d+(?:\\.\\d+)?)\\)?", Pattern.CASE_INSENSITIVE);
        Matcher sqrtMat = sqrtPat.matcher(p);
        if (sqrtMat.find()) {
            double num = Double.parseDouble(sqrtMat.group(1));
            double root = Math.sqrt(num);
            String rootStr = root == (long) root ? String.valueOf((long) root) : String.format("%.4f", root);
            return String.format(
                    "### 🧮 Mathematical Solution: Square Root\n\n" +
                    "**Question:** What is $\\sqrt{%s}$?\n\n" +
                    "#### Step-by-Step Working:\n" +
                    "- Finding the number $x$ such that $x^2 = %s$.\n" +
                    "- Since $(%s)^2 = %s$, the principal square root is:\n\n" +
                    "**🎯 Final Answer: `√%s = %s`**",
                    sqrtMat.group(1), sqrtMat.group(1), rootStr, sqrtMat.group(1), sqrtMat.group(1), rootStr
            );
        }

        // 3. Linear Equations: "solve 3x + 12 = 36" or "2x - 8 = 10" or "5x = 45"
        Pattern linPat = Pattern.compile("([+-]?\\d*(?:\\.\\d+)?)\\s*x\\s*([+-]\\s*\\d+(?:\\.\\d+)?)?\\s*=\\s*([+-]?\\d+(?:\\.\\d+)?)", Pattern.CASE_INSENSITIVE);
        Matcher linMat = linPat.matcher(p);
        if (linMat.find()) {
            String aStr = linMat.group(1) != null ? linMat.group(1).replaceAll("\\s+", "") : "";
            double a = aStr.isEmpty() || aStr.equals("+") ? 1.0 : aStr.equals("-") ? -1.0 : Double.parseDouble(aStr);
            double b = 0.0;
            if (linMat.group(2) != null) {
                b = Double.parseDouble(linMat.group(2).replaceAll("\\s+", ""));
            }
            double c = Double.parseDouble(linMat.group(3));

            if (a != 0) {
                double x = (c - b) / a;
                String xStr = x == (long) x ? String.valueOf((long) x) : String.format("%.3f", x);
                String bOp = b >= 0 ? "+ " + b : "- " + Math.abs(b);
                String subStep = b >= 0 ? "- " + b : "+ " + Math.abs(b);

                return String.format(
                        "### 🧮 Algebraic Solution: Linear Equation in One Variable\n\n" +
                        "**Equation:** $%s x %s = %s$\n\n" +
                        "#### Step-by-Step Algebraic Working:\n" +
                        "1. **Isolate the variable term (%s x):**\n" +
                        "   $$%s x = %s %s = %s$$\n" +
                        "2. **Divide both sides by the coefficient (%s):**\n" +
                        "   $$x = \\frac{%s}{%s} = %s$$\n\n" +
                        "**🎯 Final Root: `x = %s`**\n\n" +
                        "*(Verification: %s(%s) %s = %s ✓)*",
                        a, bOp, c, a, a, c, subStep, (c - b), a, (c - b), a, xStr, xStr, a, xStr, bOp, c
                );
            }
        }

        // 4. Arithmetic: "15 * 24", "15 x 24", "150 / 5", "25 + 75", "100 - 37"
        Pattern arithPat = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*([+\\-*/x×÷]|plus|minus|times|divided by)\\s*(\\d+(?:\\.\\d+)?)", Pattern.CASE_INSENSITIVE);
        Matcher arithMat = arithPat.matcher(p);
        if (arithMat.find()) {
            double n1 = Double.parseDouble(arithMat.group(1));
            String op = arithMat.group(2).toLowerCase();
            double n2 = Double.parseDouble(arithMat.group(3));

            double res = 0;
            String opSymbol = op;
            String explanation = "";

            if (op.equals("+") || op.equals("plus")) {
                res = n1 + n2;
                opSymbol = "+";
                explanation = String.format("Adding %s to %s yields %s.", n2, n1, res);
            } else if (op.equals("-") || op.equals("minus")) {
                res = n1 - n2;
                opSymbol = "-";
                explanation = String.format("Subtracting %s from %s yields %s.", n2, n1, res);
            } else if (op.equals("*") || op.equals("x") || op.equals("×") || op.equals("times")) {
                res = n1 * n2;
                opSymbol = "×";
                explanation = String.format("Multiplying %s by %s yields %s.", n1, n2, res);
            } else if (op.equals("/") || op.equals("÷") || op.equals("divided by")) {
                if (n2 == 0) {
                    return "### 🧮 Mathematical Error: Division by Zero\n\nDivision by zero is undefined in mathematics.";
                }
                res = n1 / n2;
                opSymbol = "÷";
                explanation = String.format("Dividing %s into %s equal parts yields %s.", n1, n2, res);
            }

            String resStr = res == (long) res ? String.valueOf((long) res) : String.format("%.4f", res);
            return String.format(
                    "### 🧮 Arithmetic Solution\n\n" +
                    "**Question:** What is %s %s %s?\n\n" +
                    "#### Working:\n" +
                    "$$%s %s %s = %s$$\n\n" +
                    "%s\n\n" +
                    "**🎯 Final Answer: `%s`**",
                    arithMat.group(1), opSymbol, arithMat.group(3), arithMat.group(1), opSymbol, arithMat.group(3), resStr, explanation, resStr
            );
        }

        return null;
    }

    // ──────────────────────────── LIVE WIKIPEDIA KNOWLEDGE CLIENT ────────────────────────────

    /**
     * Retrieves factual definitions, historical summaries, and scientific concepts from Wikipedia REST API.
     */
    private String fetchWikipediaKnowledge(String prompt, String subject) {
        String clean = prompt.trim()
                .replaceAll("(?i)^(what is|who is|who was|explain|define|tell me about|how does|what are|describe)\\s+", "")
                .replaceAll("[?!.]", "")
                .trim();

        if (clean.length() < 3) {
            return null;
        }

        try {
            String encodedTerm = URLEncoder.encode(clean.replace(" ", "_"), StandardCharsets.UTF_8);
            String endpoint = "https://en.wikipedia.org/api/rest_v1/page/summary/" + encodedTerm;

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .header("User-Agent", "SchoolManagementSystem-AIAcademicSuite/1.0 (academic.project@sms.local)")
                    .timeout(Duration.ofSeconds(4))
                    .GET()
                    .build();

            HttpResponse<String> resp = httpClient.send(req, HttpResponse.BodyHandlers.ofString());

            if (resp.statusCode() == 200) {
                JsonNode root = objectMapper.readTree(resp.body());
                String title = root.path("title").asText();
                String extract = root.path("extract").asText();

                if (extract != null && !extract.isBlank() && !extract.contains("may refer to:")) {
                    return String.format(
                            "### 📚 Academic Knowledge: %s\n\n" +
                            "**Direct Answer & Overview:**\n" +
                            "%s\n\n" +
                            "#### 💡 Core Takeaways & Curriculum Relevance:\n" +
                            "- **Discipline:** %s\n" +
                            "- **Key Concept:** Understanding the foundational definitions and historical/scientific context is crucial for exam evaluations.\n\n" +
                            "*(Source: Verified Open Encyclopedia Knowledge Engine)*",
                            title, extract, subject
                    );
                }
            }
        } catch (Exception e) {
            log.debug("Wikipedia query did not return a direct match: {}", e.getMessage());
        }

        return null;
    }

    // ──────────────────────────── LOCAL TARGETED PEDAGOGICAL ENGINE ────────────────────────────

    private String generatePedagogicalResponse(String prompt, String subject) {
        String p = prompt.toLowerCase();

        // 1. SPECIFIC MATHEMATICS TOPICS
        if (p.contains("quadratic") || p.contains("roots") || p.contains("discriminant")) {
            return "### 📐 Quadratic Equations & Roots\n\n" +
                    "A quadratic equation in standard form is written as:\n" +
                    "$$\\mathbf{ax^2 + bx + c = 0 \\quad (a \\neq 0)}$$\n\n" +
                    "#### The Quadratic Formula:\n" +
                    "$$x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$$\n\n" +
                    "#### The Discriminant ($D = b^2 - 4ac$):\n" +
                    "- If **$D > 0$**: Two distinct real roots.\n" +
                    "- If **$D = 0$**: Real and equal roots ($x = -b / 2a$).\n" +
                    "- If **$D < 0$**: No real roots (roots are complex conjugate numbers).";
        }

        if (p.contains("pythagoras") || p.contains("triangle") || p.contains("hypotenuse")) {
            return "### 📐 Pythagorean Theorem\n\n" +
                    "For any right-angled triangle with legs **$a$**, **$b$** and hypotenuse **$c$**:\n\n" +
                    "$$\\mathbf{a^2 + b^2 = c^2}$$\n\n" +
                    "#### Key Pythagorean Triplets:\n" +
                    "- **(3, 4, 5)**: $3^2 + 4^2 = 9 + 16 = 25 = 5^2$\n" +
                    "- **(5, 12, 13)**: $25 + 144 = 169 = 13^2$\n" +
                    "- **(8, 15, 17)**: $64 + 225 = 289 = 17^2$\n" +
                    "- **(7, 24, 25)**: $49 + 576 = 625 = 25^2$";
        }

        // 2. SPECIFIC PHYSICS TOPICS
        if (p.contains("newton") || p.contains("inertia") || p.contains("second law")) {
            return "### ⚡ Newton's Three Laws of Motion\n\n" +
                    "#### 1. First Law (Law of Inertia):\n" +
                    "An object remains at rest or in uniform motion unless compelled to change state by an external unbalanced force.\n\n" +
                    "#### 2. Second Law (Fundamental Force Equation):\n" +
                    "$$\\mathbf{F = ma}$$\n" +
                    "Force ($N$) = mass ($kg$) × acceleration ($m/s^2$).\n\n" +
                    "#### 3. Third Law (Action & Reaction):\n" +
                    "For every action, there is an equal and opposite reaction.";
        }

        if (p.contains("ohm") || p.contains("voltage") || p.contains("resistor")) {
            return "### ⚡ Ohm's Law & Circuit Analysis\n\n" +
                    "$$\\mathbf{V = I \\times R}$$\n\n" +
                    "- **Voltage ($V$):** Potential difference across conductors, in Volts ($V$).\n" +
                    "- **Current ($I$):** Rate of charge transfer, in Amperes ($A$).\n" +
                    "- **Resistance ($R$):** Opposition to current flow, in Ohms ($\\Omega$).\n\n" +
                    "**Series Resistance:** $R_{eq} = R_1 + R_2 + R_3$\n" +
                    "**Parallel Resistance:** $\\frac{1}{R_{eq}} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3}$";
        }

        // 3. SPECIFIC CHEMISTRY TOPICS
        if (p.contains("periodic") || p.contains("element") || p.contains("atomic")) {
            return "### 🧪 Modern Periodic Table Trends\n\n" +
                    "Elements are arranged by increasing atomic number ($Z$).\n\n" +
                    "#### Across a Period (Left to Right):\n" +
                    "- **Atomic Radius:** Decreases (stronger nuclear charge pulls electron shells closer).\n" +
                    "- **Electronegativity & Ionization Energy:** Increases.\n" +
                    "#### Down a Group (Top to Bottom):\n" +
                    "- **Atomic Radius:** Increases (new electron shells added).\n" +
                    "- **Metallic Character:** Increases.";
        }

        // 4. SPECIFIC COMPUTER SCIENCE TOPICS
        if (p.contains("oop") || p.contains("encapsulation") || p.contains("polymorphism") || p.contains("inheritance")) {
            return "### 💻 The Four Pillars of Object-Oriented Programming (OOP)\n\n" +
                    "1. **Encapsulation:** Binding data (fields) and methods into a single class with `private` access and getters/setters.\n" +
                    "2. **Inheritance:** Enabling a class to inherit attributes and methods from a superclass using `extends`.\n" +
                    "3. **Polymorphism:** 'Many forms'. Compile-time (method overloading) and runtime (method overriding via `@Override`).\n" +
                    "4. **Abstraction:** Hiding complex implementation details and exposing only essential interfaces using `abstract` classes or `interface`.";
        }

        // 5. HONEST TARGETED ACADEMIC GUIDANCE
        return String.format(
                "### 📖 Academic Concept Guide: %s\n\n" +
                "**Regarding your question:** *\"%s\"*\n\n" +
                "Here is structured guidance for **%s**:\n" +
                "- **Core Principle:** Identify given parameters, state governing formulas, and show clear intermediate steps with correct SI units.\n" +
                "- **Examination Focus:** Structure your answer with clear definitions, bulleted explanations, and practical examples.\n\n" +
                "💡 **Pro-Tip:** To get full dynamic generative answers to any custom question, you can connect your free Google Gemini API Key in the **⚙️ Settings** at the top right of this tutor window!",
                subject, prompt, subject
        );
    }

    private List<Map<String, Object>> getCurriculumQuizQuestions(String subject, String topic, int count) {
        List<Map<String, Object>> pool = new ArrayList<>();

        if (subject.equalsIgnoreCase("Mathematics")) {
            pool.add(Map.of(
                    "id", 1,
                    "question", "What is the nature of roots for the quadratic equation 2x² - 4x + 2 = 0?",
                    "options", List.of("A) Two distinct real roots", "B) Real and equal roots", "C) No real roots (complex)", "D) Infinite roots"),
                    "correctIndex", 1,
                    "explanation", "Discriminant D = b² - 4ac = (-4)² - 4(2)(2) = 16 - 16 = 0. When D = 0, roots are real and equal.",
                    "subject", "Mathematics", "topic", "Quadratic Equations"
            ));
            pool.add(Map.of(
                    "id", 2,
                    "question", "If sin(θ) = 3/5 in a right triangle, what is the value of cos(θ)?",
                    "options", List.of("A) 4/5", "B) 5/3", "C) 3/4", "D) 1/2"),
                    "correctIndex", 0,
                    "explanation", "Using identity sin²θ + cos²θ = 1: cos²θ = 1 - (3/5)² = 1 - 9/25 = 16/25 => cos(θ) = 4/5.",
                    "subject", "Mathematics", "topic", "Trigonometry"
            ));
            pool.add(Map.of(
                    "id", 3,
                    "question", "The 10th term of the Arithmetic Progression 2, 7, 12, 17... is:",
                    "options", List.of("A) 45", "B) 47", "C) 52", "D) 50"),
                    "correctIndex", 1,
                    "explanation", "Formula a_n = a + (n - 1)d. Here a = 2, d = 5, n = 10. a_10 = 2 + (9 × 5) = 2 + 45 = 47.",
                    "subject", "Mathematics", "topic", "Arithmetic Progressions"
            ));
            pool.add(Map.of(
                    "id", 4,
                    "question", "What is the area of a circle whose circumference is 44 cm? (Take π = 22/7)",
                    "options", List.of("A) 154 cm²", "B) 144 cm²", "C) 176 cm²", "D) 88 cm²"),
                    "correctIndex", 0,
                    "explanation", "Circumference = 2πr = 44 => 2(22/7)r = 44 => r = 7 cm. Area = πr² = (22/7) × 7² = 154 cm².",
                    "subject", "Mathematics", "topic", "Mensuration"
            ));
        } else if (subject.equalsIgnoreCase("Physics")) {
            pool.add(Map.of(
                    "id", 1,
                    "question", "A car of mass 1000 kg accelerates at 2.5 m/s². What net force is acting on it?",
                    "options", List.of("A) 400 N", "B) 2500 N", "C) 250 N", "D) 5000 N"),
                    "correctIndex", 1,
                    "explanation", "From Newton's Second Law: F = m × a = 1000 kg × 2.5 m/s² = 2500 N.",
                    "subject", "Physics", "topic", "Laws of Motion"
            ));
            pool.add(Map.of(
                    "id", 2,
                    "question", "Two resistors of 6 Ω and 3 Ω are connected in parallel. Their equivalent resistance is:",
                    "options", List.of("A) 9 Ω", "B) 4.5 Ω", "C) 2 Ω", "D) 0.5 Ω"),
                    "correctIndex", 2,
                    "explanation", "1/R_eq = 1/6 + 1/3 = 1/6 + 2/6 = 3/6 = 1/2 => R_eq = 2 Ω.",
                    "subject", "Physics", "topic", "Electricity"
            ));
            pool.add(Map.of(
                    "id", 3,
                    "question", "What is the speed of light in vacuum?",
                    "options", List.of("A) 3 × 10⁸ m/s", "B) 3 × 10⁶ m/s", "C) 3 × 10⁵ km/s", "D) Both A and C"),
                    "correctIndex", 3,
                    "explanation", "Speed of light is 3 × 10⁸ m/s, which converts to 300,000 km/s (3 × 10⁵ km/s). Both A and C are correct.",
                    "subject", "Physics", "topic", "Optics"
            ));
        } else {
            pool.add(Map.of(
                    "id", 1,
                    "question", "Which cell organelle is known as the powerhouse of the cell?",
                    "options", List.of("A) Nucleus", "B) Ribosome", "C) Mitochondria", "D) Golgi Body"),
                    "correctIndex", 2,
                    "explanation", "Mitochondria produce ATP through cellular respiration, providing energy for cellular activities.",
                    "subject", "Biology", "topic", "Cell Biology"
            ));
            pool.add(Map.of(
                    "id", 2,
                    "question", "In Java, which keyword is used to inherit a class?",
                    "options", List.of("A) implements", "B) extends", "C) inherits", "D) super"),
                    "correctIndex", 1,
                    "explanation", "The 'extends' keyword is used in Java for class inheritance. 'implements' is used for interfaces.",
                    "subject", "Computer Science", "topic", "Java OOP"
            ));
        }

        int targetCount = Math.min(count, pool.size());
        return pool.subList(0, targetCount);
    }

    private List<String> generateWorksheetQuestions(String subject, String topic) {
        return List.of(
                String.format("1. State the core fundamental definition and governing equation for %s in %s. [5 Marks]", topic, subject),
                String.format("2. Derive the primary relationship or mathematical theorem applied when solving %s problems. [10 Marks]", topic),
                String.format("3. A real-world application requires calculating an optimal parameter using %s principles. State the given assumptions and show step-by-step substitution. [15 Marks]", topic),
                String.format("4. Compare and contrast the theoretical model of %s with observed experimental results. Outline two sources of experimental uncertainty. [10 Marks]", topic),
                String.format("5. Comprehensive Case Problem: Formulate a complete solution with final numerical values and proper SI units for a standard term examination scenario on %s. [10 Marks]", topic)
        );
    }
}
