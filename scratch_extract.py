import json

with open('/Users/atharavsingh/.gemini/antigravity/brain/94a40c0e-d86d-4e92-9db1-e742f0cace75/.system_generated/logs/transcript.jsonl', 'r') as f:
    for line in f:
        data = json.loads(line)
        step = data.get('step_index')
        if step and 9600 <= step <= 9999:
            calls = data.get('tool_calls', [])
            for call in calls:
                args = call.get('args', {})
                if 'CADashboard.tsx' in str(args.get('TargetFile', '')):
                    print(f"--- STEP {step} ({call.get('name')}) ---")
                    print(f"StartLine: {args.get('StartLine')}, EndLine: {args.get('EndLine')}")
                    print(f"TargetContent:\n{args.get('TargetContent')}\n")
                    print(f"ReplacementContent:\n{args.get('ReplacementContent')}\n")
                    print("="*40)
