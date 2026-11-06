import argparse
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import requests
from urllib.parse import urljoin

# Configs
CONFIG = {
    "PARKOUR_BASE_URL": os.environ.get("PARKOUR_BASE_URL", "https://parkour.url.com/"),
    "PARKOUR_USER": os.environ.get("PARKOUR_USER", "parkourUserEmail"),
    "PARKOUR_USER_PASSWORD": os.environ.get(
        "PARKOUR_USER_PASSWORD", "parkourUserPassword"
    ),
    "PARKOUR_EMAIL_HOST": os.environ.get("PARKOUR_EMAIL_HOST", "host.address.com"),
    "PARKOUR_EMAIL_PORT": os.environ.get("PARKOUR_EMAIL_PORT", 25),
    "PARKOUR_FROM_ADDRESS": os.environ.get(
        "PARKOUR_FROM_ADDRESS", "sender@example.com"
    ),
    "PARKOUR_TO_ADDRESSES": os.environ.get(
        "PARKOUR_TO_ADDRESSES", "alias1@example.com,alias2@example.com"
    ).split(","),
}


def parse_cmd_args():
    "Parse command-line arguments"

    description = """
                     (1) Check if any sample comes from an organism for which
                     the resulsting data is privacy sensitive. If so, flag
                     project with file _TO_BE_PRIVACY_PROTECTED
                     (2) Push run and demultiplexing stats to Parkour.
                     The following environment variables must be set:
                       PARKOUR_BASE_URL, e.g. https://parkour.url.com/;
                       PARKOUR_USER, e.g. parkourUserEmail;
                       PARKOUR_USER_PASSWORD, e.g. parkourUserPassword;
                       PARKOUR_EMAIL_HOST, e.g. host.address.com;
                       PARKOUR_EMAIL_PORT, e.g. 25;
                       PARKOUR_FROM_ADDRESS, e.g. sender@example.com;
                       PARKOUR_TO_ADDRESSES, e.g. alias1@example.com,alias2@example.com (comma-separated
                       list of email addresses);
                       PRIVACY_PROTECTED_ORGANISMS, e.g. Human donor,Secret bacterium
                  """

    cmd_arg_parser = argparse.ArgumentParser(
        prog="get_sample_sheet", description=description
    )
    cmd_arg_parser.add_argument("--flowcell_id", required=False, help="Flowcell ID")
    cmd_arg_parser.add_argument("--quote_id", required=False, help="Quote ID")

    return cmd_arg_parser.parse_args()


def send_mail(message: str, config: dict[str, str]) -> None:
    mailer = MIMEMultipart()
    mailer["Subject"] = "[Parkour] Getting sample sheet from Parkour failed"
    mailer["From"] = config.get("PARKOUR_FROM_ADDRESS")
    mailer["To"] = ",".join(config.get("PARKOUR_TO_ADDRESSES", []))
    email = MIMEText(message, "plain")
    mailer.attach(email)
    s = smtplib.SMTP(
        config.get("PARKOUR_EMAIL_HOST"), port=config.get("PARKOUR_EMAIL_PORT", 25)
    )
    s.sendmail(
        config.get("PARKOUR_FROM_ADDRESS"),
        config.get("PARKOUR_TO_ADDRESSES", []),
        mailer.as_string(),
    )
    s.quit()


def main(flowcell_id: str, quote_id: str, config: dict[str:str]) -> None:
    # Construct the payload
    flowcell_id = flowcell_id.strip() if flowcell_id else None
    quote_id = quote_id.strip() if quote_id else None
    payload = {"flowcell_id": flowcell_id, "quote_id": quote_id}

    # Make the GET request to retrieve the sample sheet
    sample_sheet = requests.get(
        urljoin(config.get("PARKOUR_BASE_URL"), "api/flowcells/retrieve_samplesheet/"),
        auth=(config.get("PARKOUR_USER"), config.get("PARKOUR_USER_PASSWORD")),
        params=payload,
        verify=True,
        timeout=10,
    )

    if sample_sheet.status_code != 200:
        raise Exception(
            f"Failed to retrieve sample sheet from Parkour. Status code: {sample_sheet.status_code}, Response: {sample_sheet.text}"
        )

    # Get file name from Content-Disposition header
    content_disposition = sample_sheet.headers.get("Content-Disposition")
    if content_disposition:
        filename = content_disposition.split("filename=")[-1].strip('"')
    if not filename:
        filename = f"{flowcell_id or quote_id}_SampleSheet.csv"

    # Write the sample sheet to a file
    with open(filename, "wb") as f:
        f.write(sample_sheet.content)


if __name__ == "__main__":
    try:
        cmd_args = parse_cmd_args()
        # Check that either flowcell_id or quote_id is provided
        if not cmd_args.flowcell_id and not cmd_args.quote_id:
            raise ValueError("Either --flowcell_id or --quote_id must be provided.")

        main(cmd_args.flowcell_id, cmd_args.quote_id, CONFIG)
    except Exception as exp:
        send_mail(str(exp), CONFIG)
        raise exp

    print(
        f"Successfully retrieved sample sheet for flowcell {cmd_args.flowcell_id} or quote {cmd_args.quote_id}."
    )
