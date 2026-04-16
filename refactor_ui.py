import re

file_path = "/Users/atharavsingh/Desktop/REGULON_MASTER/frontend/src/components/ca-dashboard/AIDraftingEngine.tsx"
with open(file_path, "r") as f:
    content = f.read()

sections = [
    ("Mca", "MCA", "mca"),
    ("Gst", "GST", "gst"),
    ("IncomeTax", "Income-tax", "incomeTax"),
    ("Rbi", "RBI", "rbi"),
    ("Sebi", "SEBI", "sebi"),
    ("Customs", "Customs", "customs"),
    ("Contract", "Contract", "contract"),
    ("Custom", "Custom Regulatory", "custom")
]

for prefix_cap, label, prefix_low in sections:
    # First, locate the specific block that starts with AI Fix Assistant ({label}) up to Apply AI Fix button
    # Using specific boundaries since the code blocks are huge
    regex = re.compile(
        # The opening div: <div className="p-3 rounded-lg border border-border/50 bg-background/30 space-y-2">
        r'<div className="p-3 rounded-lg border border-border/50 bg-background/30 space-y-2">\s*'
        r'<p className="text-sm font-medium text-foreground">AI Fix Assistant.*?'
        # Match all the way to the end of the Button
        f'onClick={{handleApply{prefix_cap}Fix}}.*?'
        r'</Button>\s*</div>',
        re.DOTALL
    )
    
    # We will replace it with a single, highly advanced Supreme Audit block.
    # Note: It relies on the new handleSupremeFix functions!
    advanced_ui = f"""<div className="p-4 rounded-xl border border-primary/40 bg-primary/10 shadow-[0_0_15px_rgba(var(--primary),0.1)] relative overflow-hidden space-y-3">
                    <div className="absolute top-0 right-0 p-2">
                      <Sparkles className="w-5 h-5 text-primary opacity-50" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-foreground flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" /> REGULON Supreme Audit & Auto-Rectify ⚡
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Advanced 1-Click Workflow: Cross-validates {label} draft against statutory provisions and evidence instantly, replacing all flagged issues automatically.
                      </p>
                    </div>
                    
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-medium text-primary">1. Evidence & Statutory Context (Optional)</p>
                      <Textarea
                        value={{{prefix_low}EvidenceContext}}
                        onChange={{(e) => set{prefix_cap}EvidenceContext(e.target.value)}}
                        placeholder="Paste formal evidence extracts here (e.g. notices, ledgers, statements) to enforce 100% factual accuracy."
                        className="min-h-[70px] bg-background/60 border-primary/20 text-sm focus:border-primary"
                      />
                    </div>
                    
                    <div className="space-y-2 pt-1">
                      <p className="text-xs font-medium text-primary">2. Custom CA Instructions (Optional)</p>
                      <Textarea
                        value={{{prefix_low}UserFixNotes}}
                        onChange={{(e) => set{prefix_cap}UserFixNotes(e.target.value)}}
                        placeholder="Add strict subjective drafting instructions here..."
                        className="min-h-[70px] bg-background/60 border-primary/20 text-sm focus:border-primary"
                      />
                    </div>

                    <Button
                      type="button"
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-lg shadow-primary/25 translate-y-0 hover:-translate-y-0.5 transition-all"
                      onClick={{handleSupremeFix{prefix_cap}}}
                      disabled={{isRechecking{prefix_cap} || isApplying{prefix_cap}Fix || !draftGenerated}}
                    >
                      {{isRechecking{prefix_cap} ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Auditing {label} Draft vs Guidelines...
                        </>
                      ) : isApplying{prefix_cap}Fix ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Injecting Legal Corrections...
                        </>
                      ) : (
                        "Run Supreme Audit & Rectify Draft"
                      )}}
                    </Button>
                    
                    {{/* Display latest report results cleanly if available */}}
                    {{({prefix_low}RecheckReport && {prefix_low}RecheckReport.checkedAt) && (
                      <div className={{`mt-3 p-3 rounded border text-xs ${{
                        {prefix_low}RecheckReport.ok 
                          ? "bg-green-500/10 border-green-500/30 text-green-300"
                          : "bg-amber-500/10 border-amber-500/30 text-amber-200"
                      }}`}}>
                        <p className="font-bold flex justify-between">
                          <span>Last Audit Status: {{{prefix_low}RecheckReport.ok ? "100% CLEAR" : "CORRECTIONS APPLIED"}}</span>
                          <span>{{new Date({prefix_low}RecheckReport.checkedAt).toLocaleTimeString()}}</span>
                        </p>
                        {{!{prefix_low}RecheckReport.ok && {prefix_low}RecheckReport.flags && {prefix_low}RecheckReport.flags.length > 0 && (
                          <div className="mt-2 space-y-1 opacity-90">
                            <p className="font-medium">Rectified Items:</p>
                            <ul className="list-disc pl-4">
                              {{{prefix_low}RecheckReport.flags.slice(0, 3).map((f: any, i: number) => (
                                <li key={{i}}>{{f.issue}}</li>
                              ))}}
                              {{{prefix_low}RecheckReport.flags.length > 3 && (
                                <li>+ {{{prefix_low}RecheckReport.flags.length - 3}} more adjustments</li>
                              )}}
                            </ul>
                          </div>
                        )}}
                      </div>
                    )}}
                  </div>"""
    
    content = re.sub(regex, advanced_ui, content)

with open(file_path, "w") as f:
    f.write(content)

print("UI substitution complete.")
