import re

file_path = "/Users/atharavsingh/Desktop/SANNIDH_MASTER/frontend/src/components/ca-dashboard/AIDraftingEngine.tsx"
with open(file_path, "r") as f:
    content = f.read()

sections = [
    ("Mca", "MCA", "mca", "mcaRecheckReport"),
    ("Gst", "GST", "gst", "gstRecheckReport"),
    ("IncomeTax", "Income-tax", "incomeTax", "incomeTaxRecheckReport"),
    ("Rbi", "RBI", "rbi", "rbiRecheckReport"),
    ("Sebi", "SEBI", "sebi", "sebiRecheckReport"),
    ("Customs", "Customs", "customs", "customsRecheckReport"),
    ("Contract", "Contract", "contract", "contractRecheckReport"),
    ("Custom", "Custom", "custom", "customRecheckReport")
]

# 1. Modify handleRecheck methods to return the report
for prefix_cap, label, prefix_low, report_val in sections:
    regex_old = fr"(const handleRecheck{prefix_cap}Draft = async \(\) => {{[\s\S]*?set{prefix_cap}RecheckReport\(report\);[\s\S]*?if \(report\.ok\) toast\.success[^\n]+\n\s+else toast\.warning[^\n]+\n\s+}} catch \(error\) {{(?:[\s\S]*?)}} finally {{\n\s+setIsRechecking{prefix_cap}\(false\);\n\s+}})"
    
    # We will inject a return statement
    match = re.search(regex_old, content)
    if match:
        old_block = match.group(0)
        new_block = old_block.replace(
            f"set{prefix_cap}RecheckReport(report);",
            f"set{prefix_cap}RecheckReport(report);\n      return report;"
        ).replace(
            f"setIsRechecking{prefix_cap}(false);\n    }}",
            f"setIsRechecking{prefix_cap}(false);\n    }}\n    return null;"
        )
        content = content.replace(old_block, new_block)

# 2. Modify handleApply methods to accept an optional report and use it
for prefix_cap, label, prefix_low, report_val in sections:
    regex_apply = fr"(const handleApply{prefix_cap}Fix = async \(\) => {{)"
    if re.search(regex_apply, content):
        content = re.sub(regex_apply, f"const handleApply{prefix_cap}Fix = async (overrideReport?: any) => {{", content)
    
    # Replace (mcaRecheckReport?.flags || []) with (overrideReport?.flags || mcaRecheckReport?.flags || [])
    regex_flags = fr"\({report_val}\?\.flags \|\| \[\]\)"
    content = re.sub(regex_flags, f"(overrideReport?.flags || {report_val}?.flags || [])", content)

# 3. Add supreme handlers
supreme_handlers = []
for prefix_cap, label, prefix_low, report_val in sections:
    handler = f"""  const handleSupremeFix{prefix_cap} = async () => {{
    toast.info("Running Advanced Statutory Recheck...");
    const report = await handleRecheck{prefix_cap}Draft();
    if (report) {{
      toast.info("Applying Judicial Corrections...");
      await handleApply{prefix_cap}Fix(report);
    }}
  }};"""
    supreme_handlers.append(handler)

# Insert supreme handlers right before handleGenerateDraft
target_line = "  const handleGenerateDraft = async () => {"
if target_line in content:
    content = content.replace(target_line, "\n".join(supreme_handlers) + "\n\n" + target_line)

with open(file_path, "w") as f:
    f.write(content)
print("Transformation 1-3 complete.")
