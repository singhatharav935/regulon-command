import json

with open('scratch_step_9701.txt', 'r') as f:
    val = f.read()

# Since it might be saved as a raw JSON string or string representation from json.loads,
# let's try to parse it or unescape it properly.
if val.startswith('"') and val.endswith('"'):
    try:
        decoded = json.loads(val)
    except Exception as e:
        decoded = eval(val)
else:
    # It might contain escaped newlines
    decoded = val.replace('\\n', '\n').replace('\\"', '"').replace('\\\\', '\\')

with open('restored_step_9701.txt', 'w') as out:
    out.write(decoded)

print("Done unescaping!")
