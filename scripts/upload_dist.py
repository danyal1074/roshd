import os
import sys
import paramiko

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

def upload_dir(local_dir, remote_dir):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    connect_kwargs = {
        "hostname": HOST,
        "port": PORT,
        "username": USER,
        "timeout": 15
    }
    if KEY_FILE:
        connect_kwargs["key_filename"] = KEY_FILE
    else:
        connect_kwargs["password"] = PASSWORD
    client.connect(**connect_kwargs)
    sftp = client.open_sftp()

    def mkdir_p(remote_path):
        dirs = []
        p = remote_path
        while p and p != '/':
            dirs.append(p)
            p = os.path.dirname(p)
        for d in reversed(dirs):
            try:
                sftp.stat(d)
            except IOError:
                sftp.mkdir(d)

    mkdir_p(remote_dir)

    for root, dirs, files in os.walk(local_dir):
        rel_path = os.path.relpath(root, local_dir)
        target_dir = os.path.normpath(os.path.join(remote_dir, rel_path)).replace('\\', '/')
        mkdir_p(target_dir)

        for file in files:
            local_file = os.path.join(root, file)
            remote_file = os.path.normpath(os.path.join(target_dir, file)).replace('\\', '/')
            print(f"Uploading {local_file} -> {remote_file}")
            sftp.put(local_file, remote_file)

    sftp.close()
    client.close()
    print("Upload complete!")

if __name__ == '__main__':
    upload_dir('frontend/dist', '/var/www/roshd/frontend/dist')
