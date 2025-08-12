document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // sending an email (POST request)
  document.querySelector('#compose-form').addEventListener('submit', send_email);


  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-content-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

/**
 * view email content
 */
function view_email(id){

  fetch(`emails/${id}`)
  .then(response => response.json())
  .then(email => {
      console.log(email);

      document.querySelector('#emails-view').style.display = 'none';
      document.querySelector('#compose-view').style.display = 'none';
      document.querySelector('#email-content-view').style.display = 'block';

      document.querySelector('#email-content-view').innerHTML = 
      `<ul class = "list-group">
      <li class = "list-group-item"><strong>From:</strong> ${email.sender}</li> 
      <li class = "list-group-item"><strong>To:</strong> ${email.recipients}</li> 
      <li class = "list-group-item"><strong>Subject:</strong> ${email.subject}</li> 
      <li class = "list-group-item"><strong>Timestamp:</strong> ${email.timestamp}</li> 
      </br>
      <li class = "list-group-item">${email.body}</li> 
      </ul>`;
  
      // updating read status when user views email
      if(!email.read){
        fetch(`/email/${email.id}`,{
          method: 'PUT',
          body: JSON.stringify({
            read: true
          })
        }
        )
      }

      // Archiving
      const element = document.createElement('button');
      element.innerHTML = email.archived ? 'Unarchive': 'Archive';
      element.className = email.archived ? 'btn btn-success': 'btn btn-danger';
      element.addEventListener('click', function() {
        fetch(`/email/${email.id}`,{
          method: 'PUT',
          body: JSON.stringify({
            archived: !archived
          })
        })
        .then(() => {load_mailbox('archived')})
      });
      document.querySelector('#email-content-view').append(element);

      // Reply
      const reply_element = document.createElement('button')
      reply_element.innerHTML = 'Reply';
      reply_element.className = 'btn btn-info';
      reply_element.addEventListener('click', function(){
        compose_email();
        document.querySelector('#compose-recipients').value = email.sender;
        let subject = email.subject;
        if (subject.split(' ', 1)[0] != 'Re:'){
          subject = "Re: " + email.subject;
        }
        document.querySelector('#compose-subject').value = subject;
        document.querySelector('#compose-body').value = `On ${email.timestamp} ${email.sender} wrote: ${email.body}`;
      });
      document.querySelector('#email-content-view').append(reply_element);

    })
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-content-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // get user's mails
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      // Print emails
      console.log(emails);
      // create a div for each email
      emails.forEach(email => {
        const element = document.createElement('div');
        element.className = "list-group-item";
        element.innerHTML =  `
        <h6>Sender: ${email.sender}</h6>
        <h5>Subject: ${email.subject}</h5>
        <p>${email.sender}</p>
        `;
        element.className = email.read ? 'read': 'unread';
        element.addEventListener('click', function() {
            view_email(email.id)
            console.log('This element has been clicked!')
        });
        document.querySelector('#emails-view').append(element);
       });
      
  });
}

/* handles sending and email
 */
function send_email(event) {
  event.preventDefault();

  // store field content
  const recipients = document.querySelector('#compose-recipients').value;
  const subject =  document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

  // send data to the backend
  fetch('/emails', {
  method: 'POST',
  body: JSON.stringify({
      recipients: recipients,
      subject: subject,
      body: body
    })
  })
  .then(response => response.json())
  .then(result => {
    // Print result
    console.log(result);
    load_mailbox('sent');
  });
}
