import os
import sys
import paramiko

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

HOST = os.environ.get("DEPLOY_HOST")
PORT = int(os.environ.get("DEPLOY_PORT", "22"))
USER = os.environ.get("DEPLOY_USER", "root")
KEY_FILE = os.environ.get("DEPLOY_KEY_FILE")
PASSWORD = os.environ.get("DEPLOY_PASSWORD")

if not HOST:
    print("ERROR: DEPLOY_HOST environment variable is required.", file=sys.stderr)
    sys.exit(1)

if not KEY_FILE and not PASSWORD:
    print("ERROR: Either DEPLOY_KEY_FILE or DEPLOY_PASSWORD environment variable must be set.", file=sys.stderr)
    sys.exit(1)

def run_remote(cmd):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        connect_kwargs = {
            "hostname": HOST,
            "port": PORT,
            "username": USER,
            "timeout": 30,
            "banner_timeout": 30
        }
        if KEY_FILE:
            connect_kwargs["key_filename"] = KEY_FILE
        else:
            connect_kwargs["password"] = PASSWORD
        client.connect(**connect_kwargs)
        stdin, stdout, stderr = client.exec_command(cmd)
        out = stdout.read().decode('utf-8', errors='replace')
        err = stderr.read().decode('utf-8', errors='replace')
        return out, err
    finally:
        client.close()

if __name__ == '__main__':
    command = sys.argv[1] if len(sys.argv) > 1 else 'pm2 status'
    out, err = run_remote(command)
    if out:
        print(out)
    if err:
        print("STDERR:", err, file=sys.stderr)
