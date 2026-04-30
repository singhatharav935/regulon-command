import re

file_path = "/Users/atharavsingh/Desktop/SANNIDH_MASTER/frontend/src/components/ca-dashboard/AIDraftingEngine.tsx"
with open(file_path, "r") as f:
    content = f.read()

# 1. Inject handleUserDraftEdit right above the return statement of the main component
handle_edit_code = """
  const handleUserDraftEdit = (value: string) => {
    setDraftContent(value);
    setMcaStatutoryClear(false);
    setGstStatutoryClear(false);
    setIncomeTaxStatutoryClear(false);
    setRbiStatutoryClear(false);
    setSebiStatutoryClear(false);
    setCustomsStatutoryClear(false);
    setContractStatutoryClear(false);
    setCustomStatutoryClear(false);
  };

  return ("""

content = content.replace("  return (", handle_edit_code, 1)

# 2. Replace all instances of onChange={(e) => setDraftContent(e.target.value)}
content = content.replace(
    "onChange={(e) => setDraftContent(e.target.value)}", 
    "onChange={(e) => handleUserDraftEdit(e.target.value)}"
)

with open(file_path, "w") as f:
    f.write(content)
print("Manual edit handler injected.")
