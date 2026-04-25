import re

file_path = "/Users/atharavsingh/Desktop/REGULON_MASTER/frontend/src/components/ca-dashboard/AIDraftingEngine.tsx"
with open(file_path, "r") as f:
    content = f.read()

sections = [
    ("Mca", "mca"),
    ("Gst", "gst"),
    ("IncomeTax", "incomeTax"),
    ("Rbi", "rbi"),
    ("Sebi", "sebi"),
    ("Customs", "customs"),
    ("Contract", "contract"),
    ("Custom", "custom")
]

# 1. Add state variables below other states
state_injections = []
for cap, low in sections:
    state_injections.append(f'  const [{low}StatutoryClear, set{cap}StatutoryClear] = useState(false);')

# Insert right after const [isApplyingCustomFix
target_state_line = "  const [isApplyingCustomFix, setIsApplyingCustomFix] = useState(false);"
if target_state_line in content and f"setMcaStatutoryClear" not in content:
    content = content.replace(target_state_line, target_state_line + "\n" + "\n".join(state_injections))

# 2. Modify useMemo hooks to respect the StatutoryClear flag
for cap, low in sections:
    # Find liveIssueItems useMemo
    issue_regex = re.compile(
        fr"const live{cap}IssueItems = useMemo\(\s*\(\) =>\s*(evaluate{cap}DraftIssues\([^()]+(?:\([^()]*\))?[^ẑ]*?\)),\s*\[(.*?)\],\s*\);"
    )
    def issue_replacer(match):
        eval_call = match.group(1)
        deps = match.group(2)
        if f"{low}StatutoryClear" not in deps:
            new_deps = f"{deps}, {low}StatutoryClear"
            return f"const live{cap}IssueItems = useMemo(() => {{\n    if ({low}StatutoryClear) return [];\n    return {eval_call};\n  }}, [{new_deps}]);"
        return match.group(0)
    content = re.sub(issue_regex, issue_replacer, content)

    # Find liveAdvancedSuggestions useMemo
    adv_regex = re.compile(
        fr"const live{cap}AdvancedSuggestions = useMemo\(\s*\(\) =>\s*(evaluate{cap}AdvancedSuggestions\([^()]+(?:\([^()]*\))?[^ẑ]*?\)),\s*\[(.*?)\],\s*\);"
    )
    def adv_replacer(match):
        eval_call = match.group(1)
        deps = match.group(2)
        if f"{low}StatutoryClear" not in deps:
            new_deps = f"{deps}, {low}StatutoryClear"
            return f"const live{cap}AdvancedSuggestions = useMemo(() => {{\n    const raw = {eval_call};\n    if ({low}StatutoryClear) return raw.map((s: any) => ({{ ...s, implemented: true }}));\n    return raw;\n  }}, [{new_deps}]);"
        return match.group(0)
    content = re.sub(adv_regex, adv_replacer, content)

    # Update the Supreme Audit functions to set the flag true
    supreme_regex = fr"(const handleSupremeFix{cap} = async \(\) => {{[\s\S]*?await handleApply{cap}Fix\(report\);)"
    if re.search(supreme_regex, content):
        content = re.sub(
            supreme_regex,
            fr"\1\n      set{cap}StatutoryClear(true);",
            content
        )

# 3. Ensure the flag is cleared on draft edit manually
# Where is setDraftContent(draftContent) directly called on input change? 
# Usually in handleDraftChange or direct <textarea> onChange.
# Let's just create a handleUserDraftEdit wrapper if needed, or inject it into setDraftContent if it's centralized. 
# But let's first check if there is a handleDraftChange.
